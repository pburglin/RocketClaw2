import * as blessed from 'blessed';
import type { AppConfig } from '../config/load-config.js';
import { getQueueStats } from '../queue/store.js';
import { runDoctorChecks } from '../core/doctor.js';
import { createHealthMonitor, type HealthCheckResult } from '../health/index.js';
import { appendMessage, createSession, loadSession } from '../sessions/store.js';
import { recallMemory } from '../memory/recall.js';
import { runLlmQuery } from '../llm/client.js';
import { buildHarnessPlan, runCodingHarness } from '../harness/coding-harness.js';
import { formatCodingHarnessResult } from '../harness/formatters.js';
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
  private codingBox: any;
  private logsBox: any;
  private logs: string[] = [];
  private isRunning = false;
  private activeHarnessRun: string | null = null;

  constructor(config: AppConfig) {
    this.config = config;
    this.setupScreen();
    this.setupUI();
    this.setupEventHandlers();
  }

  private setupScreen() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'RocketClaw2 Advanced TUI',
      fullUnicode: true,
      autoPadding: true
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
      content: ' RocketClaw2 Advanced TUI - System Status ',
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
      width: '30%',
      height: '20%',
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

    // Queue status box (top-middle)
    this.queueBox = blessed.box({
      top: 1,
      left: '30%',
      width: '35%',
      height: '20%',
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

    // Active coding harness box (top-right)
    this.codingBox = blessed.box({
      top: 1,
      left: '65%',
      width: '35%',
      height: '20%',
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        border: {
          fg: '#ffffff'
        }
      },
      label: ' Coding Harness '
    });

    // Chat log box (upper-middle, takes most space)
    this.chatLog = blessed.list({
      top: '21%',
      left: 0,
      width: '70%',
      height: '50%',
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

    // Input field (bottom-left)
    this.inputField = blessed.textbox({
      top: '71%',
      left: 0,
      width: '60%',
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

    // Controls box (bottom-right)
    const controls = blessed.box({
      top: '71%',
      left: '60%',
      width: '40%',
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
      label: ' Controls '
    });

    // Add control buttons
    const harnessButton = blessed.button({
      parent: controls,
      top: 1,
      left: 1,
      width: 18,
      height: 3,
      content: ' Harness ',
      style: {
        bg: 'green',
        fg: 'black',
        hover: {
          bg: 'brightgreen'
        }
      }
    });

    harnessButton.on('press', async () => {
      await this.promptForHarnessTask();
    });

    const memoryButton = blessed.button({
      parent: controls,
      top: 1,
      left: 20,
      width: 18,
      height: 3,
      content: ' Memory ',
      style: {
        bg: 'yellow',
        fg: 'black',
        hover: {
          bg: 'brightyellow'
        }
      }
    });

    memoryButton.on('press', async () => {
      await this.showMemoryStats();
    });

    const queueButton = blessed.button({
      parent: controls,
      top: 5,
      left: 1,
      width: 18,
      height: 3,
      content: ' Queue ',
      style: {
        bg: 'cyan',
        fg: 'black',
        hover: {
          bg: 'brightcyan'
        }
      }
    });

    queueButton.on('press', async () => {
      await this.showQueueDetails();
    });

    const logsButton = blessed.button({
      parent: controls,
      top: 5,
      left: 20,
      width: 18,
      height: 3,
      content: ' Logs ',
      style: {
        bg: 'magenta',
        fg: 'black',
        hover: {
          bg: 'brightmagenta'
        }
      }
    });

    logsButton.on('press', async () => {
      this.toggleLogsView();
    });

    // Logs box (below input, full width)
    this.logsBox = blessed.box({
      top: '81%',
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
    this.screen.append(this.codingBox);
    this.screen.append(this.chatLog);
    this.screen.append(this.inputField);
    this.screen.append(controls);
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
    this.statusBar.setContent(` RocketClaw2 Advanced TUI - ${this.isRunning ? '● Running' : '○ Stopped'} `);
    
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

    // Update coding harness display
    if (this.activeHarnessRun) {
      this.codingBox.setContent(`Active Harness: ${this.activeHarnessRun.substring(0, 8)}...\nStatus: Running`);
    } else {
      this.codingBox.setContent(`No active harness\nPress 'Harness' to start`);
    }

    // Update logs display
    this.refreshLogsDisplay();
    
    this.screen.render();
  }

  private refreshLogsDisplay() {
    const logsContent = this.logs.join('\n');
    this.logsBox.setContent(logsContent || 'No logs yet');
  }

  private async promptForHarnessTask() {
    // Prompt user for harness task details
    const { promisify } = await import('node:util');
    const question = promisify(this.screen.question.bind(this.screen));
    
    try {
      const workspace = await question('Enter workspace path (or press enter for ./harness-workspace): ');
      const task = await question('Enter task description: ');
      const validateCmd = await question('Enter validation command (e.g., npm test): ');
      
      const workspacePath = workspace.trim() || './harness-workspace';
      const taskDesc = task.trim();
      const validationCommand = validateCmd.trim() || 'echo "Task completed"';
      
      if (!taskDesc) {
        this.log('Task description is required');
        return;
      }
      
      this.log(`Starting harness task: ${taskDesc}`);
      
      // Start the harness in background
      this.startCodingHarness(workspacePath, taskDesc, validationCommand);
    } catch (error) {
      this.log(`Harness prompt cancelled: ${error}`);
    }
  }

  private async startCodingHarness(workspace: string, task: string, validateCommand: string) {
    try {
      this.log(`Initializing coding harness for task: ${task}`);
      
      // Create a unique run ID
      const runId = `harness-${Date.now()}`;
      this.activeHarnessRun = runId;
      
      // Update UI to show harness is starting
      this.codingBox.setContent(`Active Harness: ${runId.substring(0, 8)}...\nStatus: Initializing...`);
      this.screen.render();
      
      // Run the harness with progress updates
      const result = await runCodingHarness(this.config, {
        workspace,
        task,
        validateCommand,
        maxIterations: 5,
        validateTimeoutMs: 15000
      }, (event) => {
        this.log(`Harness iteration ${event.iteration}: ${event.stage} - ${event.message}`);
        // Update coding box with progress
        this.codingBox.setContent(`Active Harness: ${runId.substring(0, 8)}...\nStatus: ${event.stage}\nIteration: ${event.iteration}`);
        this.screen.render();
      });
      
      // Update final status
      if (result.ok) {
        this.log(`Harness completed successfully in ${result.iterations} iterations`);
        this.codingBox.setContent(`Harness Completed ✓\nIterations: ${result.iterations}\nRun ID: ${result.runId?.substring(0, 8)}...`);
      } else {
        this.log(`Harness failed after ${result.iterations} iterations`);
        this.codingBox.setContent(`Harness Failed ✗\nIterations: ${result.iterations}\nCheck logs for details`);
      }
      
      // Clear active harness after a delay
      setTimeout(() => {
        this.activeHarnessRun = null;
        this.codingBox.setContent(`No active harness\nPress 'Harness' to start`);
        this.screen.render();
      }, 5000);
      
    } catch (error) {
      this.log(`Harness error: ${error instanceof Error ? error.message : String(error)}`);
      this.activeHarnessRun = null;
      this.codingBox.setContent(`Harness Error ✗\nCheck logs`);
      this.screen.render();
    }
  }

  private async showMemoryStats() {
    try {
      const stats = await this.getMemoryStats();
      this.log(`Memory Stats: ${stats.sessionMessages} session messages, ${stats.semanticEntries} semantic entries`);
      
      // Show a temporary popup with memory stats
      await this.showPopup('Memory Statistics', [
        `Session Messages: ${stats.sessionMessages}`,
        `Semantic Entries: ${stats.semanticEntries}`,
        `Total Salience: ${stats.totalSalience.toFixed(2)}`,
        `Avg Salience: ${stats.avgSalience.toFixed(2)}`
      ]);
    } catch (error) {
      this.log(`Failed to get memory stats: ${error}`);
    }
  }

  private async getMemoryStats() {
    // This would ideally call into the memory system to get actual stats
    // For now, return mock data
    return {
      sessionMessages: 42,
      semanticEntries: 18,
      totalSalience: 567.89,
      avgSalience: 23.45
    };
  }

  private async showQueueDetails() {
    try {
      const stats = await getQueueStats();
      this.log(`Queue Details: ${stats.pending} pending, ${stats.processing} processing, ${stats.done} done, ${stats.failed} failed`);
      
      // Show a temporary popup with queue stats
      await this.showPopup('Queue Details', [
        `Pending Items: ${stats.pending}`,
        `Processing: ${stats.processing ? 'Yes' : 'No'}`,
        `Completed: ${stats.done}`,
        `Failed: ${stats.failed}`
      ]);
    } catch (error) {
      this.log(`Failed to get queue stats: ${error}`);
    }
  }

  private async showPopup(title: string, lines: string[]) {
    const width = Math.max(...lines.map(l => l.length)) + 4;
    const height = lines.length + 4;
    
    const popup = blessed.box({
      top: 'center',
      left: 'center',
      width,
      height,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        bg: 'blue',
        border: {
          fg: '#ffffff'
        }
      },
      label: ` {bold}${title}{/bold} `
    });

    lines.forEach((line, index) => {
      const text = blessed.text({
        top: index + 2,
        left: 2,
        content: line
      });
      popup.append(text);
    });

    // Add close instruction
    const closeText = blessed.text({
      top: height - 1,
      left: 2,
      content: 'Press any key to close...',
      style: {
        fg: 'brightblack'
      }
    });
    popup.append(closeText);

    this.screen.append(popup);
    
    // Wait for key press
    await new Promise<void>((resolve) => {
      const onKey = () => {
        popup.destroy();
        this.screen.remove(popup);
        this.screen.render();
        resolve();
      };
      popup.key(['enter', 'space', 'escape'], onKey);
      popup.focus();
    });
    
    this.screen.render();
  }

  private toggleLogsView() {
    // Toggle between compact and expanded logs view
    if (this.logsBox.height === 4) {
      this.logsBox.height = 8;
      this.logsBox.label = ' System Logs (Expanded) ';
    } else {
      this.logsBox.height = 4;
      this.logsBox.label = ' System Logs ';
    }
    this.screen.render();
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Start health monitor
    this.healthMonitor = createHealthMonitor(this.config);
    this.healthMonitor.start(15000); // Check every 15 seconds
    
    // Initial display refresh
    await this.refreshDisplays();
    
    // Set up periodic refresh
    setInterval(() => this.refreshDisplays(), 3000); // Refresh every 3 seconds
    
    // Focus on input field initially
    this.inputField.focus();
    this.screen.render();
    
    this.log('Advanced TUI started');
  }

  stop() {
    this.isRunning = false;
    if (this.healthMonitor) {
      this.healthMonitor.stop();
    }
    this.screen.destroy();
    this.log('TUI stopped');
  }
}

// Factory function for creating TUI instances
export function createRocketClawTUI(config: AppConfig): RocketClawTUI {
  return new RocketClawTUI(config);
}