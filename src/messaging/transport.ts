export type InboundMessage = {
  from: string;
  to: string;
  text: string;
  chatId?: string;
  receivedAt?: string;
};

export type OutboundMessage = {
  to: string;
  text: string;
  chatId?: string;
};

export type TransportSendResult = {
  ok: boolean;
  transport: string;
  detail: string;
};

export interface NativeMessageTransport {
  readonly id: string;
  assertReady(root?: string): Promise<void>;
  shouldAcceptInbound(message: InboundMessage): boolean;
  send(message: OutboundMessage, root?: string): Promise<TransportSendResult>;
}
