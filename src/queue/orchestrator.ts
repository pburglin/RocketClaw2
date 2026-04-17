import { type AppConfig } from '../config/load-config.js';
import { processQueue, type QueueContext } from './runtime.js';
import { recordEvent } from '../telemetry/store.js';

export interface OrchestratorOptions {
  intervalMs?: number;
  batchSize?: number;
}

export class QueueOrchestrator {
  private timer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    private config: AppConfig,
    private options: OrchestratorOptions = {}
  ) {}

  start() {
    if (this.timer) return;
    const interval = this.options.intervalMs || 60_000;
    this.timer = setInterval(() => this.tick(), interval);
    
    recordEvent({
      channel: 'system',
      eventType: 'queue_processed',
      metadata: { action: 'orchestrator_started', interval },
      ok: true
    });
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const batchSize = this.options.batchSize || 5;
      const result = await processQueue(this.config, batchSize);
      
      if (result.processed > 0) {
        console.log(`[QueueOrchestrator] Background drain complete: ${result.processed} processed, ${result.failed} failed.`);
      }
    } catch (err) {
      console.error('[QueueOrchestrator] Tick failed:', err);
    } finally {
      this.isProcessing = false;
    }
  }
}