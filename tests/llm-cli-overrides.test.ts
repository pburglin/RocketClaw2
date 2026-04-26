import { afterEach, describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

describe('LLM CLI overrides', () => {
  afterEach(() => {
    // placeholder for future cleanup hooks
  });

  it('lets llm-test and llm-query use explicit mock session overrides', async () => {
    const llmTest = await execFileAsync('./node_modules/.bin/tsx', [
      'src/cli.ts',
      '--llm-mode', 'mock',
      '--llm-model', 'demo-model',
      'llm-test',
    ], {
      cwd: process.cwd(),
      env: { ...process.env },
    });

    expect(llmTest.stdout).toContain('"ok": true');
    expect(llmTest.stdout).toContain('"model": "demo-model"');

    const llmQuery = await execFileAsync('./node_modules/.bin/tsx', [
      'src/cli.ts',
      '--llm-mode', 'mock',
      '--llm-model', 'demo-model',
      'llm-query',
      '--prompt', 'First line\nSecond line',
      '--verbose',
      '--timestamps',
    ], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        RC2_MOCK_LLM_INITIAL_DELAY_MS: '0',
        RC2_MOCK_LLM_CHUNK_DELAY_MS: '0',
      },
    });

    expect(llmQuery.stdout).toContain('LLM_OK');
    expect(llmQuery.stdout).toMatch(/\[\d{2}:\d{2}:\d{2}\]/);
    expect(llmQuery.stdout).toContain('Prompt text');
    expect(llmQuery.stdout).toContain('First line\nSecond line');
    expect(llmQuery.stdout).not.toContain('First line\\nSecond line');

    const llmQueryNoStream = await execFileAsync('./node_modules/.bin/tsx', [
      'src/cli.ts',
      '--llm-mode', 'mock',
      '--no-stream',
      '--llm-model', 'demo-model',
      'llm-query',
      '--prompt', 'No stream please',
    ], {
      cwd: process.cwd(),
      env: { ...process.env },
    });

    expect(llmQueryNoStream.stdout).toContain('LLM_OK');
  }, 20000);
});
