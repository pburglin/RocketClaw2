import { loadAppConfig } from '../tools/config-store.js';
import { loadApprovals } from '../approval/store.js';

export type DoctorReport = {
  ok: boolean;
  checks: Array<{ name: string; ok: boolean; detail: string }>;
};

export async function runDoctorChecks(): Promise<DoctorReport> {
  const config = await loadAppConfig();
  const approvals = await loadApprovals();

  const checks = [
    {
      name: 'profile',
      ok: Boolean(config.profile),
      detail: `Profile: ${config.profile}`,
    },
    {
      name: 'whatsapp-config',
      ok: config.messaging.whatsapp.enabled ? Boolean(config.messaging.whatsapp.mode) : true,
      detail: `WhatsApp enabled=${config.messaging.whatsapp.enabled}, mode=${config.messaging.whatsapp.mode}`,
    },
    {
      name: 'tool-policies',
      ok: config.tools.length > 0,
      detail: `Configured tool policies: ${config.tools.length}`,
    },
    {
      name: 'yolo-warning',
      ok: !config.yolo.enabled || config.yolo.warn,
      detail: config.yolo.enabled
        ? `Yolo mode enabled with warn=${config.yolo.warn}`
        : 'Yolo mode disabled',
    },
    {
      name: 'pending-approvals',
      ok: true,
      detail: `Pending approvals: ${approvals.filter((item) => item.status === 'pending').length}`,
    },
  ];

  return {
    ok: checks.every((check) => check.ok),
    checks,
  };
}

export function formatDoctorReport(report: DoctorReport): string {
  return [
    `Doctor status: ${report.ok ? 'ok' : 'attention-needed'}`,
    ...report.checks.map((check) => `${check.ok ? 'OK' : 'WARN'} | ${check.name} | ${check.detail}`),
  ].join('\n');
}
