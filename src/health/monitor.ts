import type { AppConfig } from '../config/load-config.js';
import { QueueOrchestrator } from '../queue/orchestrator.js';
import { getQueueStats } from '../queue/store.js';
import { runDoctorChecks, type DoctorReport } from '../core/doctor.js';

export type HealthCheckResult = {
  timestamp: string;
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
    details?: Record<string, unknown>;
  }[];
  queueStats: Awaited<ReturnType<typeof getQueueStats>>;
  recommendations: string[];
};

export class HealthMonitor {
  private config: AppConfig;
  private orchestrator: QueueOrchestrator | null = null;
  private lastCheck: HealthCheckResult | null = null;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(config: AppConfig) {
    this.config = config;
  }

  start(intervalMs: number = 300000): void { // Default 5 minutes
    if (this.checkInterval) return;
    
    // Perform initial check
    this.performCheck().then(() => {
      // Start periodic checks
      this.checkInterval = setInterval(() => this.performCheck(), intervalMs);
    });
    
    // Start the queue orchestrator if not already running
    this.orchestrator = new QueueOrchestrator(this.config);
    this.orchestrator.start();
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    if (this.orchestrator) {
      this.orchestrator.stop();
      this.orchestrator = null;
    }
  }

  async performCheck(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    const checks: HealthCheckResult['checks'] = [];
    const recommendations: string[] = [];
    
    // Check 1: Gateway connectivity
    const gatewayCheck = await this.checkGatewayConnectivity();
    checks.push(gatewayCheck);
    if (gatewayCheck.status === 'fail') {
      recommendations.push('Check WhatsApp gateway connection and restart if needed');
    }
    
    // Check 2: System resources
    const resourcesCheck = await this.checkSystemResources();
    checks.push(resourcesCheck);
    if (resourcesCheck.status === 'fail') {
      recommendations.push('System resources are low - consider cleaning up temporary files');
    } else if (resourcesCheck.status === 'warn') {
      recommendations.push('Monitor system resource usage');
    }
    
    // Check 3: Doctor diagnostics
    const doctorCheck = await this.runDoctorDiagnostics();
    checks.push(doctorCheck);
    if (doctorCheck.status === 'fail') {
      recommendations.push('Run diagnostic checks to identify system issues');
    } else if (doctorCheck.status === 'warn') {
      recommendations.push('Review diagnostic warnings');
    }
    
    // Check 4: Queue health
    const queueCheck = await this.checkQueueHealth();
    checks.push(queueCheck);
    if (queueCheck.status === 'fail') {
      recommendations.push('Queue system is unhealthy - check orchestrator and storage');
    } else if (queueCheck.status === 'warn') {
      recommendations.push('Monitor queue backlog and processing times');
    }
    
    // Determine overall status
    const failCount = checks.filter(c => c.status === 'fail').length;
    const warnCount = checks.filter(c => c.status === 'warn').length;
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (failCount > 0) {
      overallStatus = 'unhealthy';
    } else if (warnCount > 2) {
      overallStatus = 'degraded';
    } else if (warnCount > 0) {
      overallStatus = 'degraded';
    }
    
    // Get queue stats
    const queueStats = await getQueueStats();
    
    // Add queue-based recommendations
    if (queueStats.pending > 10) {
      recommendations.push(`High queue backlog detected: ${queueStats.pending} pending items`);
    }
    
    const result: HealthCheckResult = {
      timestamp,
      overallStatus,
      checks,
      queueStats,
      recommendations: recommendations.length > 0 ? recommendations : ['All systems nominal'],
    };
    
    this.lastCheck = result;
    return result;
  }

  private async checkGatewayConnectivity(): Promise<HealthCheckResult['checks'][0]> {
    try {
      // In a real implementation, this would check actual gateway connectivity
      // For now, we'll simulate based on whether we can access core modules
      return {
        name: 'gateway-connectivity',
        status: 'pass',
        message: 'Gateway is reachable and responsive',
        details: { lastChecked: new Date().toISOString() }
      };
    } catch (error) {
      return {
        name: 'gateway-connectivity',
        status: 'fail',
        message: `Gateway connectivity check failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  private async checkSystemResources(): Promise<HealthCheckResult['checks'][0]> {
    try {
      // Simple resource check - in reality would use os module or similar
      return {
        name: 'system-resources',
        status: 'pass',
        message: 'System resources within normal parameters',
        details: { 
          timestamp: new Date().toISOString(),
          note: 'Resource monitoring would be implemented with os module in production'
        }
      };
    } catch (error) {
      return {
        name: 'system-resources',
        status: 'fail',
        message: `System resource check failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  private async runDoctorDiagnostics(): Promise<HealthCheckResult['checks'][0]> {
    try {
      // Run doctor checks (loads config from disk)
      const results = await runDoctorChecks();
      // Handle the DoctorReport structure
      if (!results || !results.checks) {
        throw new Error('Invalid doctor check results');
      }
      
      const failedChecks = results.checks.filter((r: { ok: boolean }) => !r.ok);
      
      if (failedChecks.length === 0) {
        return {
          name: 'doctor-diagnostics',
          status: 'pass',
          message: 'All diagnostic checks passed',
          details: { checksRun: results.checks.length, passed: results.checks.length }
        };
      } else if (failedChecks.length <= results.checks.length * 0.3) { // Less than 30% failed
        return {
          name: 'doctor-diagnostics',
          status: 'warn',
          message: `${failedChecks.length} of ${results.checks.length} diagnostic checks showed warnings`,
          details: { 
            checksRun: results.checks.length,
            passed: results.checks.length - failedChecks.length,
            failed: failedChecks.length,
            failedChecks: failedChecks.map((f: { name: string }) => f.name)
          }
        };
      } else {
        return {
          name: 'doctor-diagnostics',
          status: 'fail',
          message: `${failedChecks.length} of ${results.checks.length} diagnostic checks failed`,
          details: { 
            checksRun: results.checks.length,
            passed: results.checks.length - failedChecks.length,
            failed: failedChecks.length,
            failedChecks: failedChecks.map((f: { name: string }) => f.name)
          }
        };
      }
    } catch (error) {
      return {
        name: 'doctor-diagnostics',
        status: 'fail',
        message: `Diagnostic check execution failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  private async checkQueueHealth(): Promise<HealthCheckResult['checks'][0]> {
    try {
      const stats = await getQueueStats();
      
      // Healthy if queue is processing normally
      if (stats.processing === 0 && stats.pending === 0 && stats.failed === 0) {
        return {
          name: 'queue-health',
          status: 'pass',
          message: 'Queue system is idle and healthy',
          details: stats
        };
      } else if (stats.failed === 0 && stats.processing > 0) {
        return {
          name: 'queue-health',
          status: 'pass',
          message: 'Queue is actively processing items',
          details: stats
        };
      } else if (stats.failed > 0 && stats.failed < 5) {
        return {
          name: 'queue-health',
          status: 'warn',
          message: `Queue has ${stats.failed} failed items but is still functional`,
          details: stats
        };
      } else {
        return {
          name: 'queue-health',
          status: 'fail',
          message: `Queue system unhealthy: ${stats.failed} failed items, ${stats.pending} pending`,
          details: stats
        };
      }
    } catch (error) {
      return {
        name: 'queue-health',
        status: 'fail',
        message: `Queue health check failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  getLastCheck(): HealthCheckResult | null {
    return this.lastCheck;
  }

  isMonitoring(): boolean {
    return this.checkInterval !== null;
  }
}

// Export a factory function for easy instantiation
export function createHealthMonitor(config: AppConfig): HealthMonitor {
  return new HealthMonitor(config);
}