import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
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

export async function runCodingHarness(
  config: AppConfig,
  input: { workspace: string; task: string; validateCommand: string; maxIterations: number },
): Promise<CodingHarnessResult> {
  let lastGuidance = '';
  let lastValidationStdout = '';
  let lastValidationStderr = '';

  for (let i = 1; i <= input.maxIterations; i += 1) {
    lastGuidance = await runLlmQuery(
      config,
      [
        'You are an autonomous coding harness assistant.',
        `Workspace: ${input.workspace}`,
        `Task: ${input.task}`,
        'Provide the next implementation guidance based on the task and latest validation results.',
        `Previous validation stdout: ${lastValidationStdout || 'n/a'}`,
        `Previous validation stderr: ${lastValidationStderr || 'n/a'}`,
      ].join('\n'),
    );

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
