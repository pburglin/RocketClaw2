import { z } from 'zod';

export const YoloConfigSchema = z.object({
  enabled: z.boolean().default(false),
  warn: z.boolean().default(true),
});

export type YoloConfig = z.infer<typeof YoloConfigSchema>;
