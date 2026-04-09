import type { MessageChannelPlugin } from './types.js';

export class ChannelRegistry {
  private readonly channels = new Map<string, MessageChannelPlugin>();

  register(plugin: MessageChannelPlugin): void {
    this.channels.set(plugin.id, plugin);
  }

  get(channelId: string): MessageChannelPlugin | undefined {
    return this.channels.get(channelId);
  }

  list(): Array<{ id: string; label: string }> {
    return Array.from(this.channels.values()).map((plugin) => ({ id: plugin.id, label: plugin.label }));
  }
}
