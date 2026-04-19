import * as blessed from 'blessed';
import type { AppConfig } from '../config/load-config.js';
import { getQueueStats } from '../queue/store.js';
import { runDoctorChecks } from '../core/doctor.js';
import { createHealthMonitor, type HealthCheckResult } from '../health/index.js';
import { appendMessage, createSession, loadSession } from '../sessions/store.js';
import { recallMemory } from '../memory/recall.js';
import { runLlmQuery } from '../llm/client.js';
import pc from 'picocolors';

export class RocketClawTUI {
  private screen: any;
  private config: AppConfig;
  private healthMonitor: ReturnType<typeof createHealthMonitor> | null = null;
  private sessionId: string | null = null;
  private chatLog: any;
  private inputField: any;
  private statusBar: any;
  private healthBox: any;
  private queueBox: any;
  private logsBox: any;
  private logs: string[] = [];
  private isRunning = false;

  constructor(config: AppConfig) {
    this.config = config;
    this.setupScreen();
    this.setupUI();
    this.setupEventHandlers();
  }

  private setupScreen() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'RocketClaw2 TUI',
      fullUnicode: true
    });

    // Handle screen resize
    this.screen.on('resize', () => {
      this.layout();
    });

    // Handle Ctrl+C to exit
    this.screen.key(['C-c'], () => {
      this.stop();
      process.exit(0);
    });
  }

  private setupUI() {
    // Status bar at the top
    this.statusBar = blessed.text({
      top: 0,
      left: 0,
      width: '100%',
      height: 1,
      content: ' RocketClaw2 TUI - System Status ',
      style: {
        bg: 'blue',
        fg: 'white',
        bold: true
      }
    });

    // Health monitoring box (top-left)
    this.healthBox = blessed.box({
      top: 1,
      left: 0,
      width: '50%',
      height: '30%',
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        border: {
          fg: '#ffffff'
        }
      },
      label: ' Health Status '
    });

    // Queue status box (top-right)
    this.queueBox = blessed.box({
      top: 1,
      left: '50%',
      width: '50%',
      height: '30%',
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        border: {
          fg: '#ffffff'
        }
      },
      label: ' Queue Status '
    });

    // Chat log box (bottom-left, takes most space)
    this.chatLog = blessed.list({
      top: '31%',
      left: 0,
      width: '70%',
      height: '60%',
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        bg: 'black',
        selected: {
          bg: 'blue'
        }
      },
      label: ' Chat Log ',
      mouse: true,
      keys: true,
      vi: true,
      scrollbar: {
        ch: ' '
      }
    });

    // Input field (bottom-right)
    this.inputField = blessed.textbox({
      top: '31%',
      left: '70%',
      width: '30%',
      height: '10%',
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        border: {
          fg: '#ffffff'
        }
      },
      label: ' Input › ',
      placeholder: 'Type message and press Enter...',
      mouse: true,
      keys: true
    });

    // Logs box (below input, full width)
    this.logsBox = blessed.box({
      top: '41%',
      left: 0,
      width: '100%',
      height: '18%',
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        border: {
          fg: '#ffffff'
        }
      },
      label: ' System Logs '
    });

    // Add elements to screen
    this.screen.append(this.statusBar);
    this.screen.append(this.healthBox);
    this.screen.append(this.queueBox);
    this.screen.append(this.chatLog);
    this.screen.append(this.inputField);
    this.screen.append(this.logsBox);
  }

  private setupEventHandlers() {
    // Handle input submission
    this.inputField.key(['enter'], async (ch: any, key: any) => {
      const value = this.inputField.getValue().trim();
      if (value) {
        this.inputField.clearValue();
        await this.handleUserInput(value);
      }
    });

    // Handle input field focus on click
    this.inputField.on('focus', () => {
      this.screen.render();
    });
  }

  private layout() {
    // Recalculate positions if needed
    this.screen.render();
  }

  private async initializeSession() {
    if (!this.sessionId) {
      const session = await createSession('TUI Session');
      this.sessionId = session.id;
    }
  }

  private async handleUserInput(input: string) {
    if (!this.sessionId) {
      await this.initializeSession();
    }

    // Add user message to chat
    this.addChatMessage('user', input);

    try {
      // Recall relevant memory
      const recalled = await recallMemory(input);
      
      // Generate assistant response
      const reply = await this.generateAssistantResponse(input, recalled);
      
      // Add assistant message to chat
      this.addChatMessage('assistant', reply);
      
      // Save to session
      await appendMessage(this.sessionId!, 'user', input);
      await appendMessage(this.sessionId!, 'assistant', reply);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.addChatMessage('system', `Error: ${errMsg}`);
      this.log(`Error processing input: ${errMsg}`);
    }

    // Refresh display
    this.screen.render();
  }

  private async generateAssistantResponse(userInput: string, recalled: Awaited<ReturnType<typeof recallMemory>>): Promise<string> {
    // If no LLM configured, use fallback
    if (!this.config.llm.apiKey) {
      return this.buildFallbackReply(userInput, recalled);
    }

    // Build memory context
    const memoryBlock = recalled.length
      ? recalled
          .slice(0, 6)
          .map((hit) => (hit.kind === 'semantic' ? `Semantic memory: ${hit.text}` : `Session memory (${hit.sessionTitle}): ${hit.text}`))
          .join('\n')
      : 'No relevant memory found.';

    const prompt = [
      'You are RocketClaw2 TUI assistant.',
      'Answer the current user message helpfully using the provided memory context when relevant.',
      'If memory is relevant, use it naturally in the answer instead of just listing it back.',
      '',
      'Memory context:',
      memoryBlock,
      '',
      'User message:',
      userInput,
    ].join('\n');

    return await runLlmQuery(this.config, prompt);
  }

  private buildFallbackReply(userText: string, recalled: Awaited<ReturnType<typeof recallMemory>>): string {
    if (recalled.length === 0) {
      return `Echo: ${userText}`;
    }

    const top = recalled.slice(0, 2).map((hit) => {
      if (hit.kind === 'semantic') {
        return `semantic memory: ${hit.text}`;
      }
      return `${hit.text} (from session "${hit.sessionTitle}")`;
    });

    return [`I heard: ${userText}`, 'Relevant memory:', ...top.map((item) => `- ${item}`)].join('\n');
  }

  private addChatMessage(role: 'user' | 'assistant' | 'system', text: string) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = role === 'user' ? 'you' : role === 'assistant' ? 'assistant' : 'system';
    const color = role === 'user' ? 'cyan' : role === 'assistant' ? 'green' : 'yellow';
    
    // Format with basic colors (blessed tags)
    const formatted = `{${color}-fg}${prefix}{/${color}-fg}: ${text}`;
    this.chatLog.addItem(formatted);
    this.chatLog.select(this.chatLog.items.length - 1);
    
    // Keep only last 100 messages to prevent memory issues
    if (this.chatLog.items.length > 100) {
      this.chatLog.removeItem(0);
    }
  }

  private log(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.push(`[${timestamp}] ${message}`);
    
    // Keep only last 50 log entries
    if (this.logs.length > 50) {
      this.logs.shift();
    }
    
    // Update logs display
    this.refreshLogsDisplay();
  }

  private async refreshDisplays() {
    // Update status bar
    this.statusBar.setContent(` RocketClaw2 TUI - ${this.isRunning ? '● Running' : '○ Stopped'} `);
    
    // Update health display
    if (this.healthMonitor) {
      const health = this.healthMonitor.getLastCheck();
      if (health) {
        let healthContent = `Overall: ${health.overallStatus.toUpperCase()}\n\n`;
        healthContent += 'Checks:\n';
        health.checks.forEach(check => {
          const statusColor = check.status === 'pass' ? 'green' : 
                            check.status === 'warn' ? 'yellow' : 'red';
          healthContent += `  {${statusColor}-fg}${check.name}{/${statusColor}-fg}: ${check.message}\n`;
        });
        this.healthBox.setContent(healthContent);
      }
    }

    // Update queue display
    const queueStats = await getQueueStats();
    let queueContent = `Pending: ${queueStats.pending}\n`;
    queueContent += `Processing: ${queueStats.processing ? 'Yes' : 'No'}\n`;
    queueContent += `Completed: ${queueStats.done}\n`;
    queueContent += `Failed: ${queueStats.failed}\n`;
    this.queueBox.setContent(queueContent);

    // Update logs display
    this.refreshLogsDisplay();
    
    this.screen.render();
  }

  private refreshLogsDisplay() {
    const logsContent = this.logs.join('\n');
    this.logsBox.setContent(logsContent || 'No logs yet');
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Start health monitor
    this.healthMonitor = createHealthMonitor(this.config);
    this.healthMonitor.start(30000); // Check every 30 seconds for more responsive UI
    
    // Initial display refresh
    await this.refreshDisplays();
    
    // Set up periodic refresh
    setInterval(() => this.refreshDisplays(), 5000); // Refresh every 5 seconds
    
    // Focus on input field initially
    this.inputField.focus();
    this.screen.render();
  }

  stop() {
    this.isRunning = false;
    if (this.healthMonitor) {
      this.healthMonitor.stop();
    }
    this.screen.destroy();
  }
}

// Factory function for creating TUI instances
export function createRocketClawTUI(config: AppConfig): RocketClawTUI {
  return new RocketClawTUI(config);
}
