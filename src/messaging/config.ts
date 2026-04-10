import { z } from 'zod';

export const WhatsAppConfigSchema = z.object({
  enabled: z.boolean().default(true),
  mode: z.enum(['mock', 'webhook', 'session']).default('mock'),
  webhookUrl: z.string().url().optional(),
  defaultRecipient: z.string().optional(),
});

export type WhatsAppConfig = z.infer<typeof WhatsAppConfigSchema>;

export const MessagingConfigSchema = z.object({
  whatsapp: WhatsAppConfigSchema.default({ enabled: true, mode: 'mock' }),
});

export type MessagingConfig = z.infer<typeof MessagingConfigSchema>;
