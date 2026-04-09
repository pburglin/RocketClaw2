import { describe, expect, it } from 'vitest';
import { formatDoctorReport, runDoctorChecks } from '../src/core/doctor.js';

describe('runDoctorChecks', () => {
  it('returns a structured readiness report', async () => {
    const report = await runDoctorChecks();
    expect(report.checks.length).toBeGreaterThan(0);
    expect(formatDoctorReport(report)).toContain('Doctor status');
  });
});
