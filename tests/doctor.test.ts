import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';
import { formatDoctorReport, runDoctorChecks } from '../src/core/doctor.js';

describe('runDoctorChecks', () => {
  it('returns a structured readiness report', async () => {
    const report = await runDoctorChecks();
    expect(report.checks.length).toBeGreaterThan(0);
    expect(formatDoctorReport(report)).toContain('Doctor status');
  });

  it('flags missing session bootstrap, missing self-chat identity, and no-session activity when session mode is enabled', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-doctor-runtime-${Date.now()}`);
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(
      path.join(root, 'config.yaml'),
      YAML.stringify({ messaging: { whatsapp: { enabled: true, mode: 'session', selfChatOnly: true } } }),
    );

    const report = await runDoctorChecks(root);
    const text = formatDoctorReport(report);
    expect(report.ok).toBe(false);
    expect(text).toContain('WARN | whatsapp-session-readiness | Session mode enabled but no local WhatsApp session is configured');
    expect(text).toContain('WARN | whatsapp-self-chat-identity | Self-chat-only session mode is enabled but ownPhoneNumber is not configured');
    expect(text).toContain('WARN | session-activity | Sessions=0, messages=0, latest=n/a');

    await fs.rm(root, { recursive: true, force: true });
  });
});
