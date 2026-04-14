export type MessageSendRequest = {
  to: string;
  text: string;
  metadata?: Record<string, string>;
};

export type MessageSendResult = {
  ok: boolean;
  channel: string;
  to: string;
  transportId?: string;
  detail?: string;
  messageId?: string;
  queued?: boolean;
};

export interface MessageChannelPlugin {
  id: string;
  label: string;
  send(request: MessageSendRequest): Promise<MessageSendResult>;
}
