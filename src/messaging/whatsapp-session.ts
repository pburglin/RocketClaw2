import fs from 'node:fs/promises';
import path from 'node:path';
import { getDefaultProjectRoot } from '../config/app-paths.js';

export type WhatsAppSessionProfile = {
  mode: 'mock' | 'webhook' | 'session';
  token: string;
  phoneNumber?: string;
  createdAt: string;
  lastUsedAt?: string;
};

function getWhatsAppSessionPath(root = getDefaultProjectRoot()): string {
  return path.join(root, 'state', 'whatsapp-session.json');
}

export async function saveWhatsAppSession(profile: WhatsAppSessionProfile, root = getDefaultProjectRoot()): Promise<void> {
  const filePath = getWhatsAppSessionPath(root);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(profile, null, 2), 'utf8');
}

export async function loadWhatsAppSession(root = getDefaultProjectRoot()): Promise<WhatsAppSessionProfile | null> {
  const filePath = getWhatsAppSessionPath(root);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function touchWhatsAppSession(root = getDefaultProjectRoot()): Promise<WhatsAppSessionProfile | null> {
  const current = await loadWhatsAppSession(root);
  if (!current) return null;
  const next: WhatsAppSessionProfile = {
    ...current,
    lastUsedAt: new Date().toISOString(),
  };
  await saveWhatsAppSession(next, root);
  return next;
}

export async function clearWhatsAppSession(root = getDefaultProjectRoot()): Promise<void> {
  const filePath = getWhatsAppSessionPath(root);
  await fs.rm(filePath, { force: true });
}
