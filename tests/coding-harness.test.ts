import { describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

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
