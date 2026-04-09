import fs from 'node:fs/promises';
import path from 'node:path';
import { getDefaultProjectRoot } from '../config/app-paths.js';
import { loadImportedSkills, removeImportedSkill, upsertImportedSkill, type ImportedSkill } from './store.js';

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function inferNameFromUrl(url: string): string {
  const tail = url.split('/').filter(Boolean).pop() ?? 'skill';
  return tail.replace(/\.git$/, '');
}

export async function importSkill(sourceUrl: string, root = getDefaultProjectRoot()): Promise<ImportedSkill> {
  const name = inferNameFromUrl(sourceUrl);
  const id = slugify(name);
  const localPath = path.join(root, 'skills', id);
  await fs.mkdir(localPath, { recursive: true });
  await fs.writeFile(path.join(localPath, 'SOURCE_URL.txt'), `${sourceUrl}\n`);
  const now = new Date().toISOString();
  const skill: ImportedSkill = { id, name, sourceUrl, installedAt: now, updatedAt: now, localPath, updateCount: 0, lastAction: 'imported' };
  await upsertImportedSkill(skill, root);
  return skill;
}

export async function updateImportedSkill(id: string, root = getDefaultProjectRoot()): Promise<ImportedSkill> {
  const skills = await loadImportedSkills(root);
  const skill = skills.find((item) => item.id === id);
  if (!skill) throw new Error(`Imported skill not found: ${id}`);
  const updated: ImportedSkill = { ...skill, updatedAt: new Date().toISOString(), updateCount: (skill.updateCount ?? 0) + 1, lastAction: 'updated' };
  await upsertImportedSkill(updated, root);
  return updated;
}

export async function updateAllImportedSkills(root = getDefaultProjectRoot()): Promise<ImportedSkill[]> {
  const skills = await loadImportedSkills(root);
  const updated: ImportedSkill[] = [];
  for (const skill of skills) {
    updated.push(await updateImportedSkill(skill.id, root));
  }
  return updated;
}

export async function deleteImportedSkill(id: string, root = getDefaultProjectRoot()): Promise<boolean> {
  const skills = await loadImportedSkills(root);
  const skill = skills.find((item) => item.id === id);
  if (skill) {
    await fs.rm(skill.localPath, { recursive: true, force: true });
  }
  return removeImportedSkill(id, root);
}
