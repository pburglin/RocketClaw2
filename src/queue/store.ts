import fs from 'node:fs/promises';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';

export const QueueItemSchema = z.object({
  id: z.string().default(() => randomUUID()),
  channel: z.string(), // 'whatsapp', 'tui', 'cli', 'http'
  sender: z.string().optional(), // e.g. phone number, user id
  message: z.string(),
  receivedAt: z.string().default(() => new Date().toISOString()),
  status: z.enum(['pending', 'processing', 'done', 'failed']).default('pending'),
  attempts: z.number().default(0),
  maxAttempts: z.number().default(3),
  error: z.string().optional(),
  result: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type QueueItem = z.infer<typeof QueueItemSchema>;

const QueueStoreSchema = z.object({
  items: z.array(QueueItemSchema).default([]),
});

export type QueueStore = z.infer<typeof QueueStoreSchema>;

const STORE_PATH = new URL('../../../.queue-store.json', import.meta.url);

export async function loadQueueStore(): Promise<QueueStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    return QueueStoreSchema.parse(JSON.parse(raw));
  } catch {
    return { items: [] };
  }
}

export async function saveQueueStore(store: QueueStore): Promise<void> {
  await fs.mkdir(new URL('.', STORE_PATH).pathname, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2));
}

export async function enqueueRequest(item: Omit<QueueItem, 'id' | 'receivedAt' | 'status' | 'attempts' | 'maxAttempts'>): Promise<QueueItem> {
  const store = await loadQueueStore();
  const newItem: QueueItem = {
    ...item,
    id: randomUUID(),
    receivedAt: new Date().toISOString(),
    status: 'pending',
    attempts: 0,
    maxAttempts: 3,
  };
  store.items.push(newItem);
  await saveQueueStore(store);
  return newItem;
}

export async function peekQueue(limit = 20): Promise<QueueItem[]> {
  const store = await loadQueueStore();
  return store.items
    .filter((i) => i.status === 'pending')
    .sort((a, b) => a.receivedAt.localeCompare(b.receivedAt))
    .slice(0, limit);
}

export async function markProcessing(id: string): Promise<void> {
  const store = await loadQueueStore();
  const item = store.items.find((i) => i.id === id);
  if (item) {
    item.status = 'processing';
    item.attempts += 1;
    await saveQueueStore(store);
  }
}

export async function markDone(id: string, result: string): Promise<void> {
  const store = await loadQueueStore();
  const item = store.items.find((i) => i.id === id);
  if (item) {
    item.status = 'done';
    item.result = result;
    await saveQueueStore(store);
  }
}

export async function markFailed(id: string, error: string): Promise<void> {
  const store = await loadQueueStore();
  const item = store.items.find((i) => i.id === id);
  if (item) {
    if (item.attempts >= item.maxAttempts) {
      item.status = 'failed';
    }
    item.error = error;
    await saveQueueStore(store);
  }
}

export async function getQueueStats(): Promise<{ pending: number; processing: number; done: number; failed: number }> {
  const store = await loadQueueStore();
  return {
    pending: store.items.filter((i) => i.status === 'pending').length,
    processing: store.items.filter((i) => i.status === 'processing').length,
    done: store.items.filter((i) => i.status === 'done').length,
    failed: store.items.filter((i) => i.status === 'failed').length,
  };
}

export async function clearDoneItems(olderThanDays = 7): Promise<number> {
  const store = await loadQueueStore();
  const cutoff = new Date(Date.now() - olderThanDays * 86400 * 1000).toISOString();
  const before = store.items.length;
  store.items = store.items.filter(
    (i) => i.status !== 'done' || i.receivedAt > cutoff
  );
  await saveQueueStore(store);
  return before - store.items.length;
}
