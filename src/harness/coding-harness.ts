import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { AppConfig } from '../config/load-config.js';
import { runLlmQuery } from '../llm/client.js';
import { loadHarnessRun } from './store.js';
import { getDefaultProjectRoot } from '../config/app-paths.js';

const exec = promisify(execCb);

export type CodingHarnessResult = {
  ok: boolean;
  workspace: string;
  task: string;
  iterations: number;
  lastGuidance: string;
  lastValidationStdout: string;
  lastValidationStderr: string;
  validateCommand: string;
  runId?: string;
  artifactPath?: string;
};

interface FileEdit {
  filePath: string;
  content: string;
}

function extractCodeBlocks(text: string): FileEdit[] {
  const edits: FileEdit[] = [];
  // Parse fenced code blocks with a filename on the first line: ```filename.ext
  // Content follows on subsequent lines until the closing ```
  const fenceRegex = /```([^\s][^\n]*)\n([\s\S]*?)```/g;
  let match;
  while ((match = fenceRegex.exec(text)) !== null) {
    const filePath = match[1] ?? '';
    const content = match[2] ?? '';
    if (filePath && content.trim()) {
      edits.push({ filePath: filePath.trim(), content: content.trim() });
    }
  }
  return edits;
}

async function applyEdits(workspace: string, edits: FileEdit[]): Promise<void> {
  for (const edit of edits) {
    const filePath = path.isAbsolute(edit.filePath)
      ? edit.filePath
      : path.join(workspace, edit.filePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, edit.content, 'utf8');
  }
}


async function scanWorkspace(workspace: string): Promise<string> {
  try {
    const files = await fs.readdir(workspace, { recursive: true });
    const context: string[] = [];
    for (const f of files) {
      const relativePath = String(f);
      const filePath = path.join(workspace, relativePath);
      const stats = await fs.stat(filePath);
      if (stats.isFile() && !relativePath.includes('node_modules') && !relativePath.includes('.git')) {
        const text = await fs.readFile(filePath, 'utf8');
        context.push(`--- FILE: ${relativePath} ---\n${text}`);
      }
    }
    return context.join('\n\n');
  } catch {
    return 'Workspace is empty or inaccessible.';
  }
}

async function initWorkspace(workspace: string): Promise<void> {
  await fs.mkdir(workspace, { recursive: true });
  const pkg = path.join(workspace, 'package.json');
  try {
    await fs.access(pkg);
  } catch {
    await fs.writeFile(pkg, JSON.stringify({
      name: 'harness-workspace',
      version: '1.0.0',
      type: 'module',
      scripts: { test: 'echo "No tests yet" && exit 1' },
    }, null, 2));
  }
}

export type ValidationResult = {
  runId: string;
  workspace: string;
  task: string;
  passed: boolean;
  stdout: string;
  stderr: string;
  codeBlocksApplied: number;
  error?: string;
};

export async function replayHarnessValidation(
  runId: string,
  root = getDefaultProjectRoot(),
): Promise<ValidationResult> {
  const run = await loadHarnessRun(runId, root);
  if (!run) {
    return { runId, workspace: '', task: '', passed: false, stdout: '', stderr: '', codeBlocksApplied: 0, error: `Run not found: ${runId}` };
  }

  const r = run as Record<string, unknown>;
  const workspace = String(r.workspace ?? '');
  const task = String(r.task ?? '');

  // Re-apply code blocks from the last guidance
  const guidance = String(r.lastGuidance ?? '');
  const edits = extractCodeBlocks(guidance);
  for (const edit of edits) {
    const filePath = path.isAbsolute(edit.filePath)
      ? edit.filePath
      : path.join(workspace, edit.filePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, edit.content, 'utf8');
  }

  // Re-run the last validation command (stored in artifact or reconstructed)
  const lastValidateCmd = String(r.validateCommand ?? r._validateCommand ?? '');
  let passed = false;
  let stdout = '';
  let stderr = '';

  if (lastValidateCmd) {
    try {
      const result = await exec(lastValidateCmd, { cwd: workspace });
      passed = true;
      stdout = result.stdout.trim();
      stderr = result.stderr.trim();
    } catch (error) {
      const err = error as { stdout?: string; stderr?: string; message?: string };
      stdout = (err.stdout ?? '').trim();
      stderr = (err.stderr ?? err.message ?? '').trim();
    }
  } else {
    // Fallback: run the harness again with a single iteration to get fresh validation
    stderr = 'No validateCommand stored in artifact; cannot re-validate without it.';
  }

  return { runId, workspace, task, passed, stdout, stderr, codeBlocksApplied: edits.length };
}

export async function runCodingHarness(
  config: AppConfig,
  input: { workspace: string; task: string; validateCommand: string; maxIterations: number },
): Promise<CodingHarnessResult> {
  let lastGuidance = '';
  let lastValidationStdout = '';
  let lastValidationStderr = '';

  await initWorkspace(input.workspace);

  for (let i = 1; i <= input.maxIterations; i += 1) {
    lastGuidance = await runLlmQuery(
      config,
      [
        'REPLACE_ME_TARGET',
        `Workspace: ${input.workspace}`,
        `Task: ${input.task}`,
        '',
        'Instructions:',
        '- Generate all necessary code to complete the task',
        '- Use fenced code blocks with a filename on the first line: ```filename.ext',
        '- Only output code blocks — no explanatory text outside the blocks',
        `- Validation command that will be run: ${input.validateCommand}`,
        '',
        `Previous validation stdout: ${lastValidationStdout || 'n/a'}`,
        `Previous validation stderr: ${lastValidationStderr || 'n/a'}`,
        '',
        'Return only the files to create/update. The validator will run after files are written.',
      ].join('\n'),
    );

    const edits = extractCodeBlocks(lastGuidance);
    if (edits.length > 0) {
      await applyEdits(input.workspace, edits);
    }

    try {
      const { stdout, stderr } = await exec(input.validateCommand, { cwd: input.workspace });
      lastValidationStdout = stdout.trim();
      lastValidationStderr = stderr.trim();
      return {
        ok: true,
        workspace: input.workspace,
        task: input.task,
        iterations: i,
        lastGuidance,
        lastValidationStdout,
        lastValidationStderr,
        validateCommand: input.validateCommand,
      };
    } catch (error) {
      const err = error as { stdout?: string; stderr?: string; message?: string };
      lastValidationStdout = (err.stdout ?? '').trim();
      lastValidationStderr = (err.stderr ?? err.message ?? '').trim();
    }
  }

  return {
    ok: false,
    workspace: input.workspace,
    task: input.task,
    iterations: input.maxIterations,
    lastGuidance,
    lastValidationStdout,
    lastValidationStderr,
    validateCommand: input.validateCommand,
  };
}
