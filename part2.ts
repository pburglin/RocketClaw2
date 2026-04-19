// ── Telemetry ────────────────────────────────────────────────────────────────
program
  .command('telemetry')
  .description('Show telemetry summary (commands, errors, LLM, queue)')
  .option('--period <days>', 'lookback period in days', '7')
  .option('--perf', 'show per-command p50/p95 performance')
  .option('--deprecation', 'show deprecation candidates')
  .action(async (options) => {
    const summary = await computeSummary(
      new Date(Date.now() - Number(options.period) * 86400 * 1000).toISOString(),
    );
    console.log(formatTelemetrySummary(summary));
    if (options.perf) console.log(await formatPerfReport());
    if (options.deprecation) console.log(await formatDeprecationReport());
  });

// ── Queue ────────────────────────────────────────────────────────────────────
program
  .command('queue')
  .description('Inspect or process the request queue')
  .option('--stats', 'show queue statistics')
  .option('--process <limit>', 'process up to N pending items', '10')
  .option('--clear', 'clear done items older than 7 days')
  .action(async (options) => {
    const rootConfig = await loadAppConfig();
    const config = applySessionOverrides(rootConfig, {});
    if (options.stats) {
      const s = await getQueueStats();
      console.log(`\n📬 Queue Stats\n${'─'.repeat(30)}\n  pending:    ${s.pending}\n  processing: ${s.processing}\n  done:       ${s.done}\n  failed:     ${s.failed}`);
    }
    if (options.process) {
      const r = await runQueue(config, Number(options.process));
      console.log(`\nQueue processed: ${r.processed} ok, ${r.failed} failed`);
    }
    if (options.clear) {
      const n = await clearDoneItems();
      console.log(`\nCleared ${n} done item(s).`);
    }
  });

program
  .command('run')
  .description('Run the minimal runtime shell')
  .option('--profile <name>', 'config profile', 'default')
  .action(async (options) => {
    const config = loadConfig({ profile: options.profile });
    console.log(`RocketClaw2 runtime starting with profile: ${config.profile}`);
    
    // Start the background queue orchestrator
    const orchestrator = new QueueOrchestrator(config);
    orchestrator.start();
    console.log('Proactive queue orchestrator active.');

    // Keep process alive (minimal shell placeholder)
    process.on('SIGINT', () => {
      orchestrator.stop();
      process.exit(0);
    });
  });

program.parse();
