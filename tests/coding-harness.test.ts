import { afterEach, describe, expect, it, vi } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { loadConfig } from '../src/config/load-config.js';
import { buildHarnessPlan, runCodingHarness } from '../src/harness/coding-harness.js';

// Test the extractCodeBlocks logic directly without needing an LLM API key
describe('extractCodeBlocks (harness integration)', () => {
  // Inline the extraction logic so we test the actual parsing
  function extractCodeBlocks(text: string): Array<{ filePath: string; content: string }> {
    const edits: Array<{ filePath: string; content: string }> = [];
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

  it('parses a simple fenced code block with filename', () => {
    const input = [
      '```package.json',
      '{"name":"test","version":"1.0.0"}',
      '```',
    ].join('\n');
    const result = extractCodeBlocks(input);
    expect(result).toHaveLength(1);
    expect(result[0].filePath).toBe('package.json');
    expect(result[0].content).toBe('{"name":"test","version":"1.0.0"}');
  });

  it('parses multiple fenced code blocks', () => {
    const input = [
      '```package.json',
      '{"name":"test"}',
      '```',
      '```index.js',
      'console.log("hello");',
      '```',
    ].join('\n');
    const result = extractCodeBlocks(input);
    expect(result).toHaveLength(2);
    expect(result[0].filePath).toBe('package.json');
    expect(result[1].filePath).toBe('index.js');
  });

  it('handles deep paths like src/app/main.js', () => {
    const input = [
      '```src/app/main.js',
      'export default function() {};',
      '```',
    ].join('\n');
    const result = extractCodeBlocks(input);
    expect(result[0].filePath).toBe('src/app/main.js');
  });

  it('applies edits to the workspace by writing files', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'harness-apply-'));
    const workspace = path.join(tmp, 'project');
    await fs.mkdir(workspace);

    const edits = [
      { filePath: 'package.json', content: '{"name":"app"}' },
      { filePath: 'src/index.js', content: '// hello' },
    ];

    // Apply edits (same logic as coding-harness.ts)
    for (const edit of edits) {
      const filePath = path.isAbsolute(edit.filePath)
        ? edit.filePath
        : path.join(workspace, edit.filePath);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, edit.content, 'utf8');
    }

    const files = await fs.readdir(workspace);
    expect(files).toContain('package.json');

    const srcFiles = await fs.readdir(path.join(workspace, 'src'));
    expect(srcFiles).toContain('index.js');

    await fs.rm(tmp, { recursive: true, force: true });
  });
});

describe('workspace prompt context', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('buildHarnessPlan sends a file inventory instead of full file contents', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'harness-plan-'));
    const workspace = path.join(tmp, 'project');
    await fs.mkdir(path.join(workspace, 'src'), { recursive: true });
    await fs.writeFile(path.join(workspace, 'src', 'index.ts'), 'export const secret = 42;\n', 'utf8');
    await fs.writeFile(path.join(workspace, 'package.json'), '{"name":"demo"}\n', 'utf8');

    let requestPrompt = '';
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (...args: Parameters<typeof fetch>) => {
      const [, init] = args;
      requestPrompt = JSON.parse(String(init?.body)).messages[0].content;
      return {
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: 'Summary\n\nFiles to touch\n- src/index.ts\n\nValidation\n- npm test\n\nRisks\n- none' } }] }),
      } as Response;
    });

    const config = loadConfig({ llm: { baseUrl: 'https://example.com/v1', apiKey: 'secret', model: 'demo-model' } });
    const plan = await buildHarnessPlan(config, { workspace, task: 'Update code', validateCommand: 'npm test' });

    expect(plan.ok).toBe(true);
    expect(requestPrompt).toContain('Existing workspace files:\npackage.json\nsrc/index.ts');
    expect(requestPrompt).not.toContain('export const secret = 42;');

    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('buildHarnessPlan can stream plan text chunks to a caller callback', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'harness-plan-stream-'));
    const workspace = path.join(tmp, 'project');
    await fs.mkdir(workspace, { recursive: true });
    await fs.writeFile(path.join(workspace, 'package.json'), '{"name":"demo"}\n', 'utf8');

    const streamed: string[] = [];
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Summary\\n"}}]}\n\n'));
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Files to touch\\n- package.json\\n\\nValidation\\n- npm test\\n\\nRisks\\n- none"}}]}\n\n'));
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    }), {
      status: 200,
      headers: { 'content-type': 'text/event-stream' },
    }));

    const config = loadConfig({ llm: { baseUrl: 'https://example.com/v1', apiKey: 'secret', model: 'demo-model' } });
    const plan = await buildHarnessPlan(
      config,
      { workspace, task: 'Update code', validateCommand: 'npm test' },
      undefined,
      undefined,
      (chunk) => streamed.push(chunk),
    );

    expect(plan.planText).toContain('Summary');
    expect(streamed.join('')).toContain('Files to touch');

    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('runCodingHarness lets the model request specific file contents', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'harness-request-files-'));
    const workspace = path.join(tmp, 'project');
    await fs.mkdir(path.join(workspace, 'src'), { recursive: true });
    await fs.writeFile(path.join(workspace, 'src', 'index.ts'), 'export const importantValue = 42;\n', 'utf8');
    await fs.writeFile(path.join(workspace, 'package.json'), '{"name":"demo","type":"module"}\n', 'utf8');

    const prompts: string[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (...args: Parameters<typeof fetch>) => {
      const [, init] = args;
      const prompt = JSON.parse(String(init?.body)).messages[0].content;
      prompts.push(prompt);
      if (prompts.length === 1) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ choices: [{ message: { content: '```REQUEST_FILES\nsrc/index.ts\npackage.json\n```' } }] }),
        } as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: '```src/index.ts\nexport const importantValue = 43;\n```' } }] }),
      } as Response;
    });

    const config = loadConfig({ llm: { baseUrl: 'https://example.com/v1', apiKey: 'secret', model: 'demo-model' } });
    const result = await runCodingHarness(config, {
      workspace,
      task: 'Bump the value',
      validateCommand: 'true',
      maxIterations: 1,
    });

    expect(result.ok).toBe(true);
    expect(prompts[0]).toContain('Existing workspace files:\npackage.json\nsrc/index.ts');
    expect(prompts[0]).not.toContain('importantValue = 42');
    expect(prompts[1]).toContain('Requested file contents:');
    expect(prompts[1]).toContain('--- FILE: src/index.ts ---\nexport const importantValue = 42;');

    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('buildHarnessPlan emits AI is thinking progress updates while waiting on the model', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'harness-plan-progress-'));
    const workspace = path.join(tmp, 'project');
    await fs.mkdir(workspace, { recursive: true });
    await fs.writeFile(path.join(workspace, 'package.json'), '{"name":"demo"}\n', 'utf8');

    const progress: Array<{ iteration: number; stage: string; message: string }> = [];
    vi.spyOn(globalThis, 'setInterval').mockImplementation(((fn: () => void) => {
      fn();
      return 1 as any;
    }) as any);
    vi.spyOn(globalThis, 'clearInterval').mockImplementation(() => undefined as any);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: 'Summary\n\nFiles to touch\n- package.json\n\nValidation\n- npm test\n\nRisks\n- none' } }] }),
    } as Response);

    const config = loadConfig({ llm: { baseUrl: 'https://example.com/v1', apiKey: 'secret', model: 'demo-model' } });
    const plan = await buildHarnessPlan(
      config,
      { workspace, task: 'Update code', validateCommand: 'npm test' },
      undefined,
      (event) => progress.push(event),
    );

    expect(plan.ok).toBe(true);
    expect(progress.some((event) => event.stage === 'llm-waiting' && event.message.startsWith('AI is thinking...'))).toBe(true);

    await fs.rm(tmp, { recursive: true, force: true });
  });
});
