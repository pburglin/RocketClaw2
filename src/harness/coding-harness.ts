import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { AppConfig } from '../config/load-config.js';
import { runLlmQuery } from '../llm/client.js';
import { loadHarnessRun } from './store.js';
import { saveHarnessRun } from './store.js';
import { saveIterationEntry } from './iteration-store.js';
import { getDefaultProjectRoot, getHarnessRunsDir } from '../config/app-paths.js';
import { randomUUID } from 'node:crypto';

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

async function applyEdits(workspace: string, edits: FileEdit[]): Promise<{ created: string[]; modified: string[] }> {
  const created: string[] = [];
  const modified: string[] = [];
  for (const edit of edits) {
    const filePath = path.isAbsolute(edit.filePath)
      ? edit.filePath
      : path.join(workspace, edit.filePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    await fs.writeFile(filePath, edit.content, 'utf8');
    if (exists) modified.push(edit.filePath);
    else created.push(edit.filePath);
  }
  return { created, modified };
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

  const guidance = String(r.lastGuidance ?? '');
  const edits = extractCodeBlocks(guidance);
  for (const edit of edits) {
    const filePath = path.isAbsolute(edit.filePath) ? edit.filePath : path.join(workspace, edit.filePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, edit.content, 'utf8');
  }

  const lastValidateCmd = String(r.validateCommand ?? '');
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

  const runId = randomUUID();

  for (let i = 1; i <= input.maxIterations; i += 1) {
    const workspaceContext = await scanWorkspace(input.workspace);
    lastGuidance = await runLlmQuery(
      config,
      [
        'You are an autonomous coding harness. Your job is to implement the requested task.',
        `Workspace: ${input.workspace}`,
        workspaceContext ? `Existing workspace files:\n${workspaceContext}` : '',
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
      ].filter(Boolean).join('\n'),
    );

    const edits = extractCodeBlocks(lastGuidance);
    const { created, modified } = edits.length > 0
      ? await applyEdits(input.workspace, edits)
      : { created: [], modified: [] };

    let passed = false;
    try {
      const { stdout, stderr } = await exec(input.validateCommand, { cwd: input.workspace });
      lastValidationStdout = stdout.trim();
      lastValidationStderr = stderr.trim();
      passed = true;
      await saveIterationEntry(runId, {
        iteration: i,
        timestamp: new Date().toISOString(),
        guidance: lastGuidance,
        filesCreated: created,
        filesModified: modified,
        validationPassed: passed,
        validationStdout: lastValidationStdout,
        validationStderr: lastValidationStderr,
      });

      if (passed) {
        return {
          ok: true,
          workspace: input.workspace,
          task: input.task,
          iterations: i,
          lastGuidance,
          lastValidationStdout,
          lastValidationStderr,
          validateCommand: input.validateCommand,
          artifactPath: path.join(getHarnessRunsDir(), `${runId}.json`),
        };
      }
    } catch (error) {
      const err = error as { stdout?: string; stderr?: string; message?: string };
      lastValidationStdout = (err.stdout ?? '').trim();
      lastValidationStderr = (err.stderr ?? err.message ?? '').trim();

      await saveIterationEntry(runId, {
        iteration: i,
        timestamp: new Date().toISOString(),
        guidance: lastGuidance,
        filesCreated: created,
        filesModified: modified,
        validationPassed: false,
        validationStdout: lastValidationStdout,
        validationStderr: lastValidationStderr,
      });
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

export async function harnessResume(
  config: AppConfig,
  runId: string,
  root = getDefaultProjectRoot(),
): Promise<CodingHarnessResult & { resumedFrom: string }> {
  const prev = await loadHarnessRun(runId, root);
  if (!prev) throw new Error(`Run not found: ${runId}`);

  const r = prev as Record<string, unknown>;
  const workspace = String(r.workspace ?? '');
  const task = String(r.task ?? '');
  const validateCommand = String(r.validateCommand ?? '');
  const lastGuidance = String(r.lastGuidance ?? '');
  const lastValidationStdout = String(r.lastValidationStdout ?? '');
  const lastValidationStderr = String(r.lastValidationStderr ?? '');

  if (!workspace || !task || !validateCommand) {
    throw new Error(`Run ${runId} is missing workspace, task, or validateCommand — cannot resume.`);
  }

  // Re-apply last guidance's code blocks so workspace matches the saved state
  if (lastGuidance) {
    const edits = extractCodeBlocks(lastGuidance);
    for (const edit of edits) {
      const filePath = path.isAbsolute(edit.filePath) ? edit.filePath : path.join(workspace, edit.filePath);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, edit.content, 'utf8');
    }
  }

  // One fresh LLM iteration with full workspace context
  const workspaceContext = await scanWorkspace(workspace);
  const freshGuidance = await runLlmQuery(
    config,
    [
      'You are an autonomous coding harness. Your job is to implement the requested task.',
      `Workspace: ${workspace}`,
      workspaceContext ? `Existing workspace files:\n${workspaceContext}` : '',
      `Task: ${task}`,
      '',
      'Instructions:',
      '- Generate all necessary code to complete the task',
      '- Use fenced code blocks with a filename on the first line: ```filename.ext',
      '- Only output code blocks — no explanatory text outside the blocks',
      `- Validation command: ${validateCommand}`,
      '',
      `Previous attempt stdout: ${lastValidationStdout || 'n/a'}`,
      `Previous attempt stderr: ${lastValidationStderr || 'n/a'}`,
      '',
      'Return only the files to create/update. The validator will run after files are written.',
    ].filter(Boolean).join('\n'),
  );

  const edits = extractCodeBlocks(freshGuidance);
  for (const edit of edits) {
    const filePath = path.isAbsolute(edit.filePath) ? edit.filePath : path.join(workspace, edit.filePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, edit.content, 'utf8');
  }

  let newValidationStdout = '';
  let newValidationStderr = '';
  let ok = false;

  try {
    const result = await exec(validateCommand, { cwd: workspace });
    newValidationStdout = result.stdout.trim();
    newValidationStderr = result.stderr.trim();
    ok = true;
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    newValidationStdout = (err.stdout ?? '').trim();
    newValidationStderr = (err.stderr ?? err.message ?? '').trim();
  }

  return {
    ok,
    workspace,
    task,
    iterations: Number(r.iterations ?? 0) + 1,
    lastGuidance: freshGuidance,
    lastValidationStdout: newValidationStdout,
    lastValidationStderr: newValidationStderr,
    validateCommand,
    resumedFrom: runId,
  };
}
