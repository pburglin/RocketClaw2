import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { AppConfig } from '../config/load-config.js';
import { runLlmQuery } from '../llm/client.js';

const exec = promisify(execCb);

export type CodingHarnessResult = {
  ok: boolean;
  workspace: string;
  task: string;
  iterations: number;
  lastGuidance: string;
  lastValidationStdout: string;
  lastValidationStderr: string;
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
        'You are an autonomous coding harness. Your job is to implement the requested task.',
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
  };
}
