export function formatHarnessRuns(items: Array<Record<string, unknown>>): string {
  if (items.length === 0) return 'No harness runs found.';
  return items
    .map((item) => `${item.runId} | kind=${item.kind ?? 'run'} | ok=${item.ok} | workspace=${item.workspace} | task=${item.task}`)
    .join('\n');
}
