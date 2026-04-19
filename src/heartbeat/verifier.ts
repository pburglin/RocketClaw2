import type { AppConfig } from '../config/load-config.js';
import { getQueueStats } from '../queue/store.js';
import { processQueue } from '../queue/runtime.js';
import { runDoctorChecks } from '../core/doctor.js';
import { loadAppConfig } from '../tools/config-store.js';
import { runLlmQuery } from '../llm/client.js';
import { applySessionOverrides } from '../config/session-overrides.js';
import { createHealthMonitor, type HealthCheckResult } from '../health/monitor.js';
import { appendMessage, createSession } from '../sessions/store.js';
import { recallMemory } from '../memory/recall.js';

export type HeartbeatVerificationResult = {
  timestamp: string;
  healthCheck: HealthCheckResult;
  queueProcessed: {
    processed: number;
    failed: number;
  };
  scheduledTasks: {
    executed: string[];
    skipped: string[];
    actionsTaken: string[];
    recommendations: string[];
  };
  recommendations: string[];
  actionsTaken: string[];
};

export class HeartbeatVerifier {
  private config: AppConfig;
  private healthMonitor: ReturnType<typeof createHealthMonitor>;
  private lastVerification: HeartbeatVerificationResult | null = null;
  private verificationInterval: NodeJS.Timeout | null = null;
  private _isRunning = false;

  // Task tracking for scheduled tasks
  private lastTaskExecution: Map<string, number> = new Map();

  constructor(config: AppConfig) {
    this.config = config;
    this.healthMonitor = createHealthMonitor(config);
  }

  /**
   * Start the heartbeat verification system
   * @param intervalMs Interval between verifications (default: 5 minutes)
   */
  start(intervalMs: number = 300000): void {
    if (this._isRunning) return;

    this._isRunning = true;
    
    // Start health monitor
    this.healthMonitor.start(intervalMs);
    
    // Perform initial verification
    this.performVerification().then(() => {
      // Start periodic verifications
      this.verificationInterval = setInterval(() => this.performVerification(), intervalMs);
    });
    
    console.log('[HeartbeatVerifier] Background verification system started');
  }

  /**
   * Stop the heartbeat verification system
   */
  stop(): void {
    if (!this._isRunning) return;

    this._isRunning = false;
    
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
      this.verificationInterval = null;
    }
    
    this.healthMonitor.stop();
    
    console.log('[HeartbeatVerifier] Background verification system stopped');
  }

  /**
   * Perform a complete verification cycle
   */
  async performVerification(): Promise<HeartbeatVerificationResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const actionsTaken: string[] = [];
    const recommendations: string[] = [];
    
    try {
      // 1. Perform health check
      const healthCheck = await this.healthMonitor.performCheck();
      
      // 2. Process task queue based on health and queue status
      const queueResult = await this.processTaskQueueIfNeeded(healthCheck);
      if (queueResult.processed > 0 || queueResult.failed > 0) {
        actionsTaken.push(`Processed ${queueResult.processed} queue items (${queueResult.failed} failed)`);
      }
      
      // 3. Execute scheduled tasks
      const scheduledResult = await this.executeScheduledTasksIfNeeded(healthCheck);
      actionsTaken.push(...scheduledResult.actionsTaken);
      recommendations.push(...scheduledResult.recommendations);
      
      // 4. Generate recommendations based on overall status
      const healthRecs = this.generateRecommendations(healthCheck, queueResult);
      recommendations.push(...healthRecs);
      
      const result: HeartbeatVerificationResult = {
        timestamp,
        healthCheck,
        queueProcessed: queueResult,
        scheduledTasks: scheduledResult,
        recommendations,
        actionsTaken
      };
      
      this.lastVerification = result;
      
      // Log summary if there were actions or issues
      if (actionsTaken.length > 0 || healthCheck.overallStatus !== 'healthy') {
        console.log(`[HeartbeatVerifier] Verification complete: ${healthCheck.overallStatus.toUpperCase()} - ${actionsTaken.length} actions taken`);
      }
      
      return result;
    } catch (error) {
      console.error('[HeartbeatVerifier] Verification failed:', error);
      
      // Return error result
      const errorResult: HeartbeatVerificationResult = {
        timestamp,
        healthCheck: {
          timestamp,
          overallStatus: 'unhealthy',
          checks: [{
            name: 'heartbeat-verifier',
            status: 'fail',
            message: `Heartbeat verifier failed: ${error instanceof Error ? error.message : String(error)}`
          }],
          queueStats: await getQueueStats(),
          recommendations: ['Heartbeat verification system failed - manual inspection required']
        },
        queueProcessed: { processed: 0, failed: 0 },
        scheduledTasks: { executed: [], skipped: [], actionsTaken: [], recommendations: [] },
        recommendations: ['Heartbeat verification system experienced an error'],
        actionsTaken: ['Verification cycle aborted due to error']
      };
      
      this.lastVerification = errorResult;
      return errorResult;
    }
  }

  /**
   * Process task queue if conditions are met
   */
  private async processTaskQueueIfNeeded(healthCheck: HealthCheckResult): Promise<{ processed: number; failed: number }> {
    // Only process queue if system is healthy or degraded (not unhealthy)
    if (healthCheck.overallStatus === 'unhealthy') {
      return { processed: 0, failed: 0 };
    }
    
    const queueStats = await getQueueStats();
    
    // Process queue if there are pending items
    if (queueStats.pending > 0) {
      const batchSize = Math.min(10, queueStats.pending); // Process up to 10 items
      const result = await processQueue(this.config, batchSize);
      return result;
    }
    
    return { processed: 0, failed: 0 };
  }

  /**
   * Execute scheduled tasks if conditions are met
   */
  private async executeScheduledTasksIfNeeded(healthCheck: HealthCheckResult): Promise<{
    executed: string[];
    skipped: string[];
    actionsTaken: string[];
    recommendations: string[];
  }> {
    const executed: string[] = [];
    const skipped: string[] = [];
    const actionsTaken: string[] = [];
    const recommendations: string[] = [];
    
    // Don't execute scheduled tasks if system is unhealthy
    if (healthCheck.overallStatus === 'unhealthy') {
      skipped.push('System unhealthy - skipping scheduled tasks');
      return { executed, skipped, actionsTaken, recommendations };
    }
    
    const now = Date.now();
    
    // Define scheduled tasks with their intervals
    const scheduledTasks = [
      {
        name: 'memory-consolidation',
        intervalMs: 60 * 60 * 1000, // Every hour
        description: 'Run memory consolidation/dreaming process'
      },
      {
        name: 'telemetry-update',
        intervalMs: 30 * 60 * 1000, // Every 30 minutes
        description: 'Update telemetry statistics'
      },
      {
        name: 'semantic-memory-promotion',
        intervalMs: 2 * 60 * 60 * 1000, // Every 2 hours
        description: 'Promote high-salience memories to semantic store'
      },
      {
        name: 'approval-cleanup',
        intervalMs: 24 * 60 * 60 * 1000, // Daily
        description: 'Clean up expired approval requests'
      }
    ];
    
    for (const task of scheduledTasks) {
      const lastExecution = this.lastTaskExecution.get(task.name) || 0;
      const timeSinceLast = now - lastExecution;
      
      if (timeSinceLast >= task.intervalMs) {
        try {
          await this.executeScheduledTask(task.name, healthCheck);
          this.lastTaskExecution.set(task.name, now);
          executed.push(task.name);
          actionsTaken.push(`Executed scheduled task: ${task.description}`);
        } catch (error) {
          console.error(`[HeartbeatVerifier] Failed to execute scheduled task ${task.name}:`, error);
          skipped.push(`${task.name}: ${error instanceof Error ? error.message : String(error)}`);
          actionsTaken.push(`Failed to execute scheduled task: ${task.description}`);
        }
      } else {
        const nextIn = Math.ceil((task.intervalMs - timeSinceLast) / (60 * 1000)); // minutes
        skipped.push(`${task.name}: next execution in ${nextIn} minutes`);
      }
    }
    
    return { executed, skipped, actionsTaken, recommendations };
  }

  /**
   * Execute a specific scheduled task
   */
  private async executeScheduledTask(taskName: string, healthCheck: HealthCheckResult): Promise<void> {
    switch (taskName) {
      case 'memory-consolidation':
        await this.runMemoryConsolidation();
        break;
        
      case 'telemetry-update':
        await this.updateTelemetry();
        break;
        
      case 'semantic-memory-promotion':
        await this.promoteSemanticMemories();
        break;
        
      case 'approval-cleanup':
        await this.cleanupApprovals();
        break;
        
      default:
        throw new Error(`Unknown scheduled task: ${taskName}`);
    }
  }

  /**
   * Run memory consolidation/dreaming process
   */
  private async runMemoryConsolidation(): Promise<void> {
    // Import here to avoid circular dependencies
    const { buildConsolidationPlan } = await import('../memory/consolidation.js');
    const { rememberCandidate } = await import('../memory/remember.js');
    
    try {
      const plan = await buildConsolidationPlan();
      const promotees = plan.filter((item: any) => item.suggestedAction === 'promote');
      
      if (promotees.length > 0) {
        for (const candidate of promotees) {
          await rememberCandidate(candidate);
        }
        console.log(`[HeartbeatVerifier] Memory consolidation: promoted ${promotees.length} candidates`);
      }
    } catch (error) {
      console.error('[HeartbeatVerifier] Memory consolidation failed:', error);
      throw error;
    }
  }

  /**
   * Update telemetry statistics
   */
  private async updateTelemetry(): Promise<void> {
    const { computeSummary } = await import('../telemetry/store.js');
    
    try {
      // Update telemetry summary (this runs lightweight computation)
      const summary = await computeSummary(
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Last 24 hours
      );
      
      // Just computing it updates internal caches and triggers any necessary updates
      console.log(`[HeartbeatVerifier] Telemetry updated for last 24 hours`);
    } catch (error) {
      console.error('[HeartbeatVerifier] Telemetry update failed:', error);
      // Don't throw - telemetry updates are best effort
    }
  }

  /**
   * Promote high-salience memories to semantic store
   */
  private async promoteSemanticMemories(): Promise<void> {
    const { buildConsolidationPlan } = await import('../memory/consolidation.js');
    const { rememberCandidate } = await import('../memory/remember.js');
    const { loadSemanticMemory } = await import('../memory/semantic-store.js');
    
    try {
      const plan = await buildConsolidationPlan();
      const promotees = plan.filter((item: any) => item.suggestedAction === 'promote');
      
      // Only promote if we have good candidates (salience >= 30 as per existing code)
      const highQualityPromotees = promotees.filter(
        (item: any) => item.salience >= 30
      );
      
      if (highQualityPromotees.length > 0) {
        for (const candidate of highQualityPromotees) {
          await rememberCandidate(candidate);
        }
        console.log(`[HeartbeatVerifier] Semantic promotion: ${highQualityPromotees.length} high-salience memories promoted`);
      } else if (promotees.length > 0) {
        console.log(`[HeartbeatVerifier] Semantic promotion: ${promotees.length} candidates below salience threshold`);
      }
    } catch (error) {
      console.error('[HeartbeatVerifier] Semantic promotion failed:', error);
      throw error;
    }
  }

  /**
   * Clean up expired approval requests
   */
  private async cleanupApprovals(): Promise<void> {
    const { purgeStaleApprovals } = await import('../approval/store.js');
    
    try {
      const purged = await purgeStaleApprovals(30); // Remove approvals older than 30 days
      if (purged > 0) {
        console.log(`[HeartbeatVerifier] Approval cleanup: removed ${purged} stale approvals`);
      }
    } catch (error) {
      console.error('[HeartbeatVerifier] Approval cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Generate recommendations based on health check and queue status
   */
  private generateRecommendations(healthCheck: HealthCheckResult, queueResult: { processed: number; failed: number }): string[] {
    const recommendations: string[] = [];
    
    // Health-based recommendations
    if (healthCheck.overallStatus === 'unhealthy') {
      recommendations.push('System unhealthy - immediate attention required');
    } else if (healthCheck.overallStatus === 'degraded') {
      recommendations.push('System degraded - monitor closely');
    }
    
    // Check-specific recommendations
    for (const check of healthCheck.checks) {
      if (check.status === 'fail') {
        recommendations.push(`Failed check: ${check.name} - ${check.message}`);
      } else if (check.status === 'warn') {
        recommendations.push(`Warning: ${check.name} - ${check.message}`);
      }
    }
    
    // Queue-based recommendations
    if (queueResult.failed > 0) {
      recommendations.push(`Queue processing had ${queueResult.failed} failures - investigate`);
    }
    
    if (queueResult.processed > 0) {
      recommendations.push(`Processed ${queueResult.processed} queue items successfully`);
    }
    
    // If no specific recommendations, provide a positive one
    if (recommendations.length === 0 && healthCheck.overallStatus === 'healthy') {
      recommendations.push('All systems operating normally');
    }
    
    return recommendations;
  }

  /**
   * Get the last verification result
   */
  getLastVerification(): HeartbeatVerificationResult | null {
    return this.lastVerification;
  }

  /**
   * Check if the verifier is currently running
   */
  isRunning(): boolean {
    return this._isRunning;
  }
}

// Factory function for easy instantiation
export function createHeartbeatVerifier(config: AppConfig): HeartbeatVerifier {
  return new HeartbeatVerifier(config);
}
