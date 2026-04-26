import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { AppConfig } from '../config/load-config.js';
import { runLlmQuery, type LlmTraceEvent } from '../llm/client.js';
import { loadHarnessRun, saveHarnessRun } from './store.js';
import { saveIterationEntry } from './iteration-store.js';
import { getDefaultProjectRoot } from '../config/app-paths.js';
import { loadIterationEntries } from './iteration-store.js';

const exec = promisify(execCb);
const LLM_WAIT_UPDATE_MS = Math.max(10, Number(process.env.RC2_LLM_WAIT_UPDATE_MS ?? 15000) || 15000);

export type HarnessEditMode = 'full-file' | 'diff' | 'mixed';

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
  status?: 'running' | 'completed' | 'failed' | 'interrupted';
  editMode?: HarnessEditMode;
};

type RunCodingHarnessResumeState = {
  runId?: string;
  resumedFrom?: string;
  previousIterations?: number;
  lastGuidance?: string;
  lastCriticInsight?: string;
  lastValidationStdout?: string;
  lastValidationStderr?: string;
  executedPlanId?: string;
  editMode?: HarnessEditMode;
};

interface FullFileEdit {
  kind: 'full-file';
  filePath: string;
  content: string;
}

interface SearchReplaceEdit {
  kind: 'search-replace';
  filePath: string;
  search: string;
  replace: string;
}

type HarnessEdit = FullFileEdit | SearchReplaceEdit;

function extractCodeBlocks(text: string): HarnessEdit[] {
  const edits: HarnessEdit[] = [];
  const fenceRegex = /```([^\s][^\n]*)\n([\s\S]*?)```/g;
  let match;
  while ((match = fenceRegex.exec(text)) !== null) {
    const filePath = match[1] ?? '';
    const content = match[2] ?? '';
    if (filePath.trim().startsWith('SEARCH_REPLACE')) continue;
    if (filePath && content.trim()) {
      edits.push({ kind: 'full-file', filePath: filePath.trim(), content: content.trim() });
    }
  }

  const replaceRegex = /```SEARCH_REPLACE\s+([^\n]+)\n([\s\S]*?)```/g;
  while ((match = replaceRegex.exec(text)) !== null) {
    const filePath = (match[1] ?? '').trim();
    const body = match[2] ?? '';
    const hunkRegex = /<<<<<<< SEARCH\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> REPLACE/g;
    let hunk;
    while ((hunk = hunkRegex.exec(body)) !== null) {
      edits.push({
        kind: 'search-replace',
        filePath,
        search: hunk[1] ?? '',
        replace: hunk[2] ?? '',
      });
    }
  }

  return edits;
}

function countOccurrences(text: string, search: string): number {
  if (!search) return 0;
  let count = 0;
  let index = 0;
  while (true) {
    const found = text.indexOf(search, index);
    if (found === -1) return count;
    count += 1;
    index = found + search.length;
  }
}

async function applyEdits(workspace: string, edits: HarnessEdit[]): Promise<{ created: string[]; modified: string[] }> {
  const created: string[] = [];
  const modified: string[] = [];
  for (const edit of edits) {
    const filePath = path.isAbsolute(edit.filePath)
      ? edit.filePath
      : path.join(workspace, edit.filePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const exists = await fs.access(filePath).then(() => true).catch(() => false);

    if (edit.kind === 'full-file') {
      await fs.writeFile(filePath, edit.content, 'utf8');
      if (exists) modified.push(edit.filePath);
      else created.push(edit.filePath);
      continue;
    }

    if (!exists) {
      throw new Error(`SEARCH_REPLACE target does not exist: ${edit.filePath}`);
    }

    const current = await fs.readFile(filePath, 'utf8');
    if (!edit.search) {
      await fs.writeFile(filePath, `${edit.replace}${current}`, 'utf8');
      modified.push(edit.filePath);
      continue;
    }

    const occurrences = countOccurrences(current, edit.search);
    if (occurrences === 0) {
      throw new Error(`SEARCH_REPLACE block not found in ${edit.filePath}`);
    }
    if (occurrences > 1) {
      throw new Error(`SEARCH_REPLACE block is ambiguous in ${edit.filePath}; matched ${occurrences} times`);
    }

    await fs.writeFile(filePath, current.replace(edit.search, edit.replace), 'utf8');
    modified.push(edit.filePath);
  }
  return { created, modified };
}

const MAX_REQUESTED_FILES = 8;
const MAX_REQUESTED_FILE_BYTES = 24_000;

function shouldIncludeWorkspacePath(relativePath: string): boolean {
  return !relativePath.includes('node_modules') && !relativePath.includes('.git');
}

async function scanWorkspace(workspace: string): Promise<string> {
  try {
    const files = await fs.readdir(workspace, { recursive: true });
    const context: string[] = [];
    for (const f of files) {
      const relativePath = String(f);
      const filePath = path.join(workspace, relativePath);
      const stats = await fs.stat(filePath);
      if (stats.isFile() && shouldIncludeWorkspacePath(relativePath)) {
        context.push(relativePath);
      }
    }
    context.sort((a, b) => a.localeCompare(b));
    return context.length > 0 ? context.join('\n') : 'Workspace is empty.';
  } catch {
    return 'Workspace is empty or inaccessible.';
  }
}

function extractRequestedFiles(text: string): string[] {
  const requestBlock = text.match(/```REQUEST_FILES\n([\s\S]*?)```/i);
  if (!requestBlock) return [];
  return requestBlock[1]
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith('#'))
    .map((line) => line.replace(/^[-*]\s*/, ''))
    .map((line) => line.replace(/^`|`$/g, ''))
    .filter((line) => !path.isAbsolute(line) && !line.includes('..'))
    .slice(0, MAX_REQUESTED_FILES);
}

async function readRequestedFiles(workspace: string, requestedFiles: string[]): Promise<string> {
  const sections: string[] = [];
  for (const relativePath of requestedFiles) {
    if (!shouldIncludeWorkspacePath(relativePath)) continue;
    const filePath = path.join(workspace, relativePath);
    try {
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) continue;
      const text = await fs.readFile(filePath, 'utf8');
      const content = text.length > MAX_REQUESTED_FILE_BYTES
        ? `${text.slice(0, MAX_REQUESTED_FILE_BYTES)}\n...[truncated]`
        : text;
      sections.push(`--- FILE: ${relativePath} ---\n${content}`);
    } catch {
      sections.push(`--- FILE: ${relativePath} ---\n[unavailable]`);
    }
  }
  return sections.join('\n\n');
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
  editMode?: HarnessEditMode;
  runId?: string;
  artifactPath?: string;
};

function buildEditInstructions(editMode: HarnessEditMode): string[] {
  if (editMode === 'full-file') {
    return [
      'Return only complete file contents in fenced blocks where the fence label is the relative file path, for example:',
      '```src/index.ts',
      'export const value = 1;',
      '```',
      'When changing an existing file, rewrite the full file content in that block.',
    ];
  }

  if (editMode === 'diff') {
    return [
      'Prefer targeted SEARCH_REPLACE edit blocks for existing files, and use full-file fenced blocks only for brand new files.',
      'For existing-file edits, return blocks exactly like this:',
      '```SEARCH_REPLACE src/index.ts',
      '<<<<<<< SEARCH',
      'const value = 1;',
      '=======',
      'const value = 2;',
      '>>>>>>> REPLACE',
      '```',
      'SEARCH text must match exactly once in the target file.',
    ];
  }

  return [
    'Prefer targeted SEARCH_REPLACE edit blocks for small changes in existing files, and use full-file fenced blocks for brand new files or intentional full rewrites.',
    'SEARCH_REPLACE format for existing files:',
    '```SEARCH_REPLACE src/index.ts',
    '<<<<<<< SEARCH',
    'const value = 1;',
    '=======',
    'const value = 2;',
    '>>>>>>> REPLACE',
    '```',
    'Full-file format for new files or complete rewrites:',
    '```src/index.ts',
    'export const value = 2;',
    '```',
  ];
}

async function buildCriticInsight(
  config: AppConfig,
  input: { task: string; workspace: string; validateCommand: string; stdout: string; stderr: string },
  onLlmTrace?: (event: LlmTraceEvent) => void,
  onLlmToken?: (chunk: string, label?: string) => void,
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
      { channel: 'cli', label: 'critic insight', onTrace: onLlmTrace, stream: Boolean(onLlmToken), onToken: onLlmToken ? (chunk) => onLlmToken(chunk, 'critic insight') : undefined },
    );
    return response.trim();
  } catch {
    return '';
  }
}

export async function buildHarnessPlan(
  config: AppConfig,
  input: { workspace: string; task: string; validateCommand: string; editMode?: HarnessEditMode },
  onLlmTrace?: (event: LlmTraceEvent) => void,
  onProgress?: (event: { iteration: number; stage: string; message: string }) => void,
  onLlmToken?: (chunk: string, label?: string) => void,
): Promise<HarnessPlan> {
  await initWorkspace(input.workspace);
  const workspaceContext = await scanWorkspace(input.workspace);
  onProgress?.({ iteration: 1, stage: 'llm-request', message: 'Requesting implementation plan from the model' });
  const llmStart = Date.now();
  const llmHeartbeat = setInterval(() => {
    const elapsedSeconds = Math.round((Date.now() - llmStart) / 1000);
    onProgress?.({ iteration: 1, stage: 'llm-waiting', message: `AI is thinking... (${elapsedSeconds}s elapsed, press Ctrl+C to cancel)` });
  }, LLM_WAIT_UPDATE_MS);

  let planText = '';
  try {
    planText = await runLlmQuery(
      config,
      [
        'You are planning an autonomous coding harness task.',
        'Do not write code. Produce a concise implementation plan only.',
        'Include these sections exactly: Summary, Files to touch, Validation, Risks.',
        'The workspace context below is a relative file inventory, not full file contents.',
        `Workspace: ${input.workspace}`,
        workspaceContext ? `Existing workspace files:\n${workspaceContext}` : '',
        `Task: ${input.task}`,
        `Validation command: ${input.validateCommand}`,
      ].filter(Boolean).join('\n'),
      { channel: 'cli', label: 'plan generation', onTrace: onLlmTrace, stream: Boolean(onLlmToken), onToken: onLlmToken ? (chunk) => onLlmToken(chunk, 'plan generation') : undefined },
    );
  } finally {
    clearInterval(llmHeartbeat);
  }

  onProgress?.({ iteration: 1, stage: 'llm-response', message: 'Received implementation plan from the model' });

  return {
    kind: 'plan',
    ok: true,
    approvalStatus: 'draft',
    workspace: input.workspace,
    task: input.task,
    validateCommand: input.validateCommand,
    editMode: input.editMode ?? 'mixed',
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
  input: { workspace: string; task: string; validateCommand: string; maxIterations: number; validateTimeoutMs?: number; editMode?: HarnessEditMode },
  onProgress?: (event: { iteration: number; stage: string; message: string }) => void,
  onLlmTrace?: (event: LlmTraceEvent) => void,
  onLlmToken?: (chunk: string, label?: string) => void,
  resumeState?: RunCodingHarnessResumeState,
): Promise<CodingHarnessResult> {
  let lastGuidance = resumeState?.lastGuidance ?? '';
  let lastCriticInsight = resumeState?.lastCriticInsight ?? '';
  let lastValidationStdout = resumeState?.lastValidationStdout ?? '';
  let lastValidationStderr = resumeState?.lastValidationStderr ?? '';

  await initWorkspace(input.workspace);

  const runId = resumeState?.runId ?? `run-${Date.now()}`;
  const completedIterations = resumeState?.previousIterations ?? 0;
  const editMode = resumeState?.editMode ?? input.editMode ?? 'mixed';

  await saveHarnessRun({
    ok: false,
    status: 'running',
    workspace: input.workspace,
    task: input.task,
    iterations: completedIterations,
    lastGuidance,
    lastCriticInsight: lastCriticInsight || undefined,
    lastValidationStdout,
    lastValidationStderr,
    validateCommand: input.validateCommand,
    editMode,
    resumedFrom: resumeState?.resumedFrom,
    executedPlanId: resumeState?.executedPlanId,
    runId,
  }, undefined, runId);

  for (let i = completedIterations + 1; i <= input.maxIterations; i += 1) {
    onProgress?.({ iteration: i, stage: 'iteration-start', message: `Starting iteration ${i}` });
    const workspaceContext = await scanWorkspace(input.workspace);
    const basePrompt = [
      'You are an autonomous coding harness. Your job is to implement the requested task.',
      'The workspace context below is only a relative file inventory, not full file contents.',
      'If you need file contents before writing code, respond with only a fenced block named REQUEST_FILES listing one relative path per line, for example:',
      '```REQUEST_FILES',
      'src/index.ts',
      'package.json',
      '```',
      `Workspace: ${input.workspace}`,
      workspaceContext ? `Existing workspace files:\n${workspaceContext}` : '',
      `Task: ${input.task}`,
      '',
      'Instructions:',
      '- Generate all necessary code to complete the task',
      '- Only output edit blocks — no explanatory text outside the blocks',
      `- Validation command that will be run: ${input.validateCommand}`,
      `- Edit mode to use: ${editMode}`,
      ...buildEditInstructions(editMode),
      '',
      `Previous validation stdout: ${lastValidationStdout || 'n/a'}`,
      `Previous validation stderr: ${lastValidationStderr || 'n/a'}`,
      `Critic insight from previous failure: ${lastCriticInsight || 'n/a'}`,
      '',
      'If you request files, do not emit code in the same response.',
      'Return only the files to create/update once you have enough context. The validator will run after files are written.',
    ].filter(Boolean).join('\n');

    const queryModel = async (prompt: string, label: string) => {
      onProgress?.({ iteration: i, stage: 'llm-request', message: 'Requesting implementation guidance from the model' });
      const llmStart = Date.now();
      const llmHeartbeat = setInterval(() => {
        const elapsedSeconds = Math.round((Date.now() - llmStart) / 1000);
        onProgress?.({ iteration: i, stage: 'llm-waiting', message: `AI is thinking... (${elapsedSeconds}s elapsed, press Ctrl+C to cancel)` });
      }, LLM_WAIT_UPDATE_MS);
      try {
        return await runLlmQuery(config, prompt, {
          channel: 'cli',
          label,
          onTrace: onLlmTrace,
          stream: Boolean(onLlmToken),
          onToken: onLlmToken ? (chunk) => onLlmToken(chunk, label) : undefined,
        });
      } finally {
        clearInterval(llmHeartbeat);
      }
    };

    lastGuidance = await queryModel(basePrompt, `implementation guidance (iteration ${i})`);
    const requestedFiles = extractRequestedFiles(lastGuidance);
    if (requestedFiles.length > 0) {
      onProgress?.({ iteration: i, stage: 'workspace-context-request', message: `Model requested ${requestedFiles.length} file(s): ${requestedFiles.join(', ')}` });
      const requestedContents = await readRequestedFiles(input.workspace, requestedFiles);
      lastGuidance = await queryModel([
        basePrompt,
        '',
        'Requested file contents:',
        requestedContents || '[no requested file contents could be loaded]',
        '',
        ...buildEditInstructions(editMode),
        'Now return only edit blocks for the files to create/update. Do not ask for more files unless absolutely necessary.',
      ].join('\n'), `implementation guidance with requested files (iteration ${i})`);
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
      }, onLlmTrace, onLlmToken);
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

    await saveHarnessRun({
      ok: false,
      status: 'running',
      workspace: input.workspace,
      task: input.task,
      iterations: i,
      lastGuidance,
      lastCriticInsight: lastCriticInsight || undefined,
      lastValidationStdout,
      lastValidationStderr,
      validateCommand: input.validateCommand,
      editMode,
      resumedFrom: resumeState?.resumedFrom,
      executedPlanId: resumeState?.executedPlanId,
      runId,
    }, undefined, runId);

    if (ok) {
      const result: CodingHarnessResult = {
        ok: true,
        status: 'completed',
        workspace: input.workspace,
        task: input.task,
        iterations: i,
        lastGuidance,
        lastCriticInsight: lastCriticInsight || undefined,
        lastValidationStdout,
        lastValidationStderr,
        validateCommand: input.validateCommand,
        editMode,
      };
      const artifact = await saveHarnessRun({ ...result, runId }, undefined, runId);
      return { ...result, runId: artifact.runId, artifactPath: artifact.path };
    }
  }

  const failed: CodingHarnessResult = {
    ok: false,
    status: 'failed',
    workspace: input.workspace,
    task: input.task,
    iterations: input.maxIterations,
    lastGuidance,
    lastCriticInsight: lastCriticInsight || undefined,
    lastValidationStdout,
    lastValidationStderr,
    validateCommand: input.validateCommand,
    editMode,
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
  }, undefined, undefined, undefined, {
    resumedFrom: runId,
    lastGuidance,
    lastValidationStdout: String(r.lastValidationStdout ?? ''),
    lastValidationStderr: String(r.lastValidationStderr ?? ''),
    lastCriticInsight: String(r.lastCriticInsight ?? ''),
    editMode: (r.editMode as HarnessEditMode | undefined) ?? 'mixed',
  });

  return { ...result, resumedFrom: runId };
}

export async function resumeCodingHarnessRun(
  config: AppConfig,
  runId: string,
  options: { maxIterations?: number; validateTimeoutMs?: number; onProgress?: (event: { iteration: number; stage: string; message: string }) => void; onLlmTrace?: (event: LlmTraceEvent) => void; onLlmToken?: (chunk: string, label?: string) => void; root?: string } = {},
): Promise<CodingHarnessResult & { resumedFrom: string }> {
  const root = options.root ?? getDefaultProjectRoot();
  const prev = await loadHarnessRun(runId, root);
  if (!prev) throw new Error(`Run not found: ${runId}`);

  const r = prev as Record<string, unknown>;
  const workspace = String(r.workspace ?? '');
  const task = String(r.task ?? '');
  const validateCommand = String(r.validateCommand ?? '');
  if (!workspace || !task || !validateCommand) {
    throw new Error(`Run ${runId} is missing workspace, task, or validateCommand, cannot resume.`);
  }

  const entries = await loadIterationEntries(runId, root);
  const previousIterations = entries.length;
  const storedIterations = Number((r.iterations ?? previousIterations) || 1);
  const maxIterations = options.maxIterations ?? Math.max(previousIterations + 1, storedIterations);

  const result = await runCodingHarness(config, {
    workspace,
    task,
    validateCommand,
    maxIterations,
    validateTimeoutMs: options.validateTimeoutMs,
  }, options.onProgress, options.onLlmTrace, options.onLlmToken, {
    resumedFrom: runId,
    previousIterations,
    lastGuidance: String(r.lastGuidance ?? ''),
    lastValidationStdout: String(r.lastValidationStdout ?? ''),
    lastValidationStderr: String(r.lastValidationStderr ?? ''),
    lastCriticInsight: String(r.lastCriticInsight ?? ''),
    executedPlanId: typeof r.executedPlanId === 'string' ? r.executedPlanId : undefined,
    editMode: (r.editMode as HarnessEditMode | undefined) ?? 'mixed',
  });

  return { ...result, resumedFrom: runId };
}


export async function runCodingHarnessFromPlan(
  config: AppConfig,
  runId: string,
  rootOrOverrides: string | { root?: string; maxIterations?: number; validateTimeoutMs?: number; editMode?: HarnessEditMode; onProgress?: (event: { iteration: number; stage: string; message: string }) => void; onLlmTrace?: (event: LlmTraceEvent) => void; onLlmToken?: (chunk: string, label?: string) => void } = getDefaultProjectRoot(),
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
  const onLlmTrace = typeof rootOrOverrides === 'string'
    ? undefined
    : rootOrOverrides.onLlmTrace;
  const onLlmToken = typeof rootOrOverrides === 'string'
    ? undefined
    : rootOrOverrides.onLlmToken;
  const editModeOverride = typeof rootOrOverrides === 'string'
    ? undefined
    : rootOrOverrides.editMode;

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
    editMode: editModeOverride ?? (planned.editMode as HarnessEditMode | undefined) ?? 'mixed',
  }, onProgress, onLlmTrace, onLlmToken, {
    executedPlanId: runId,
    editMode: editModeOverride ?? (planned.editMode as HarnessEditMode | undefined) ?? 'mixed',
  });
  return { ...result, executedPlanId: runId };
}
