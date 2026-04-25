import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { AppConfig } from '../config/load-config.js';
import { runLlmQuery } from '../llm/client.js';
import { loadHarnessRun, saveHarnessRun } from './store.js';
import { saveIterationEntry } from './iteration-store.js';
import { getDefaultProjectRoot } from '../config/app-paths.js';

const exec = promisify(execCb);

export type CodingHarnessResult = {
  ok: boolean;
  workspace: string;
  task: string;
  iterations: number;
  lastGuidance: string;
  lastCriticInsight?: string;
  lastValidationStdout: string;
  lastValidationStderr: string;
  validateCommand: string;
  runId?: string;
  artifactPath?: string;
  resumedFrom?: string;
  executedPlanId?: string;
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

export type HarnessPlan = {
  kind: 'plan';
  ok: true;
  approvalStatus: 'draft' | 'approved';
  approvalRequestId?: string;
  approvedAt?: string;
  workspace: string;
  task: string;
  validateCommand: string;
  planText: string;
  runId?: string;
  artifactPath?: string;
};

async function buildCriticInsight(
  config: AppConfig,
  input: { task: string; workspace: string; validateCommand: string; stdout: string; stderr: string },
): Promise<string> {
  try {
    const response = await runLlmQuery(
      config,
      [
        'You are the critic for an autonomous coding harness.',
        'Analyze the latest validation failure and identify the most likely root cause and the next best corrective direction.',
        'Be concise and concrete.',
        `Workspace: ${input.workspace}`,
        `Task: ${input.task}`,
        `Validation command: ${input.validateCommand}`,
        `Validation stdout: ${input.stdout || 'n/a'}`,
        `Validation stderr: ${input.stderr || 'n/a'}`,
      ].join('\n'),
    );
    return response.trim();
  } catch {
    return '';
  }
}

export async function buildHarnessPlan(
  config: AppConfig,
  input: { workspace: string; task: string; validateCommand: string },
): Promise<HarnessPlan> {
  await initWorkspace(input.workspace);
  const workspaceContext = await scanWorkspace(input.workspace);
  const planText = await runLlmQuery(
    config,
    [
      'You are planning an autonomous coding harness task.',
      'Do not write code. Produce a concise implementation plan only.',
      'Include these sections exactly: Summary, Files to touch, Validation, Risks.',
      `Workspace: ${input.workspace}`,
      workspaceContext ? `Existing workspace files:\n${workspaceContext}` : '',
      `Task: ${input.task}`,
      `Validation command: ${input.validateCommand}`,
    ].filter(Boolean).join('\n'),
  );

  return {
    kind: 'plan',
    ok: true,
    approvalStatus: 'draft',
    workspace: input.workspace,
    task: input.task,
    validateCommand: input.validateCommand,
    planText: planText.trim(),
  };
}

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
  await applyEdits(workspace, edits);

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
  input: { workspace: string; task: string; validateCommand: string; maxIterations: number; validateTimeoutMs?: number },
  onProgress?: (event: { iteration: number; stage: string; message: string }) => void,
): Promise<CodingHarnessResult> {
  let lastGuidance = '';
  let lastCriticInsight = '';
  let lastValidationStdout = '';
  let lastValidationStderr = '';

  await initWorkspace(input.workspace);

  const runId = `run-${Date.now()}`;

  for (let i = 1; i <= input.maxIterations; i += 1) {
    onProgress?.({ iteration: i, stage: 'iteration-start', message: `Starting iteration ${i}` });
    const workspaceContext = await scanWorkspace(input.workspace);
    onProgress?.({ iteration: i, stage: 'llm-request', message: 'Requesting implementation guidance from the model' });
    const llmStart = Date.now();
    const llmHeartbeat = setInterval(() => {
      const elapsedSeconds = Math.round((Date.now() - llmStart) / 1000);
      onProgress?.({ iteration: i, stage: 'llm-waiting', message: `Still waiting on model response (${elapsedSeconds}s elapsed, press Ctrl+C to cancel)` });
    }, 15000);
    try {
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
        `Critic insight from previous failure: ${lastCriticInsight || 'n/a'}`,
        '',
        'Return only the files to create/update. The validator will run after files are written.',
      ].filter(Boolean).join('\n'),
    );
    } finally {
      clearInterval(llmHeartbeat);
    }

    onProgress?.({ iteration: i, stage: 'llm-response', message: 'Received implementation guidance from the model' });
    const edits = extractCodeBlocks(lastGuidance);
    const { created, modified } = edits.length > 0
      ? await applyEdits(input.workspace, edits)
      : { created: [], modified: [] };
    onProgress?.({ iteration: i, stage: 'files-written', message: `Applied changes, created=${created.length}, modified=${modified.length}` });

    let ok = false;
    onProgress?.({ iteration: i, stage: 'validation-start', message: `Running validation: ${input.validateCommand}` });
    try {
      const execOptions = input.validateTimeoutMs === undefined
        ? { cwd: input.workspace }
        : { cwd: input.workspace, timeout: input.validateTimeoutMs };
      const { stdout, stderr } = await exec(input.validateCommand, execOptions);
      lastValidationStdout = stdout.trim();
      lastValidationStderr = stderr.trim();
      ok = true;
      onProgress?.({ iteration: i, stage: 'validation-passed', message: 'Validation passed' });
    } catch (error) {
      const err = error as { stdout?: string; stderr?: string; message?: string; killed?: boolean; signal?: string };
      lastValidationStdout = (err.stdout ?? '').trim();
      lastValidationStderr = (err.stderr ?? err.message ?? '').trim();
      if (String(err.message ?? '').includes('timed out') || err.killed) {
        lastValidationStderr = `Validation command timed out. Use a short-lived check such as npm test or set a larger timeout if you really need it. Original detail: ${lastValidationStderr}`.trim();
      }
      onProgress?.({ iteration: i, stage: 'validation-failed', message: 'Validation failed, analyzing cause' });
      lastCriticInsight = await buildCriticInsight(config, {
        task: input.task,
        workspace: input.workspace,
        validateCommand: input.validateCommand,
        stdout: lastValidationStdout,
        stderr: lastValidationStderr,
      });
    }

    await saveIterationEntry(runId, {
      iteration: i,
      timestamp: new Date().toISOString(),
      guidance: lastGuidance,
      criticInsight: lastCriticInsight || undefined,
      filesCreated: created,
      filesModified: modified,
      validationPassed: ok,
      validationStdout: lastValidationStdout,
      validationStderr: lastValidationStderr,
    });

    if (ok) {
      const result: CodingHarnessResult = {
        ok: true,
        workspace: input.workspace,
        task: input.task,
        iterations: i,
        lastGuidance,
        lastCriticInsight: lastCriticInsight || undefined,
        lastValidationStdout,
        lastValidationStderr,
        validateCommand: input.validateCommand,
      };
      const artifact = await saveHarnessRun({ ...result, runId }, undefined, runId);
      return { ...result, runId: artifact.runId, artifactPath: artifact.path };
    }
  }

  const failed: CodingHarnessResult = {
    ok: false,
    workspace: input.workspace,
    task: input.task,
    iterations: input.maxIterations,
    lastGuidance,
    lastCriticInsight: lastCriticInsight || undefined,
    lastValidationStdout,
    lastValidationStderr,
    validateCommand: input.validateCommand,
  };
  const artifact = await saveHarnessRun({ ...failed, runId }, undefined, runId);
  return { ...failed, runId: artifact.runId, artifactPath: artifact.path };
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

  if (!workspace || !task || !validateCommand) {
    throw new Error(`Run ${runId} is missing workspace, task, or validateCommand, cannot resume.`);
  }

  await fs.mkdir(workspace, { recursive: true });
  if (lastGuidance) {
    const edits = extractCodeBlocks(lastGuidance);
    await applyEdits(workspace, edits);
  }

  const result = await runCodingHarness(config, {
    workspace,
    task,
    validateCommand,
    maxIterations: 1,
  });

  return { ...result, resumedFrom: runId };
}


export async function runCodingHarnessFromPlan(
  config: AppConfig,
  runId: string,
  rootOrOverrides: string | { root?: string; maxIterations?: number; validateTimeoutMs?: number; onProgress?: (event: { iteration: number; stage: string; message: string }) => void } = getDefaultProjectRoot(),
): Promise<CodingHarnessResult & { executedPlanId: string }> {
  const root = typeof rootOrOverrides === 'string'
    ? rootOrOverrides
    : (rootOrOverrides.root ?? getDefaultProjectRoot());
  const maxIterations = typeof rootOrOverrides === 'string'
    ? 5
    : (rootOrOverrides.maxIterations ?? 5);
  const validateTimeoutMs = typeof rootOrOverrides === 'string'
    ? undefined
    : rootOrOverrides.validateTimeoutMs;
  const onProgress = typeof rootOrOverrides === 'string'
    ? undefined
    : rootOrOverrides.onProgress;

  const planned = await loadHarnessRun(runId, root);
  if (!planned) throw new Error(`Harness artifact not found: ${runId}`);
  if (planned.kind !== 'plan') throw new Error(`Harness artifact is not a plan: ${runId}`);
  if (planned.approvalStatus !== 'approved') throw new Error(`Harness plan is not approved: ${runId}`);

  const result = await runCodingHarness(config, {
    workspace: String(planned.workspace ?? ''),
    task: String(planned.task ?? ''),
    validateCommand: String(planned.validateCommand ?? ''),
    maxIterations,
    validateTimeoutMs,
  }, onProgress);
  return { ...result, executedPlanId: runId };
}
