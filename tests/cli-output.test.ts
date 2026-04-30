import { describe, expect, it } from 'vitest';
import {
  buildBottomFooterClear,
  buildBottomFooterRender,
  buildFloatingFooterClear,
  buildFloatingFooterRender,
  buildFooterReserveEnd,
  buildFooterReserveStart,
} from '../src/cli-output.js';

describe('cli footer control sequences', () => {
  it('redraws the waiting footer without injecting a newline', () => {
    const sequence = buildFloatingFooterRender('| › [iter 1] AI is thinking... (15s elapsed, press Ctrl+C to cancel)');
    expect(sequence).not.toContain('\n');
    expect(sequence).toContain('\r');
  });

  it('clears the waiting footer without injecting a newline', () => {
    const sequence = buildFloatingFooterClear();
    expect(sequence).not.toContain('\n');
    expect(sequence).toContain('\r');
  });

  it('can reserve the bottom row as a footer-only scroll-exempt area', () => {
    const sequence = buildFooterReserveStart(40);
    expect(sequence).toContain('[1;39r');
    expect(sequence).not.toContain('\n');
  });

  it('renders footer text onto the terminal bottom row without a newline', () => {
    const sequence = buildBottomFooterRender(40, '› status');
    expect(sequence).toContain('[40;1H');
    expect(sequence).not.toContain('\n');
  });

  it('clears the reserved footer row without a newline and can restore the full scroll region', () => {
    expect(buildBottomFooterClear(40)).toContain('[40;1H');
    expect(buildBottomFooterClear(40)).not.toContain('\n');
    expect(buildFooterReserveEnd()).toBe('\x1b[r');
  });
});
