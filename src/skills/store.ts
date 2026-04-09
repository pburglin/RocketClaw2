import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { getDefaultProjectRoot } from '../config/app-paths.js';

export const ImportedSkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  sourceUrl: z.string(),
  installedAt: z.string(),
  updatedAt: z.string(),
  localPath: z.string(),
});

export type ImportedSkill = z.infer<typeof ImportedSkillSchema>;

function getSkillsDir(root = getDefaultProjectRoot()): string {
  return path.join(root, 'skills');
}

function getSkillsRegistryPath(root = getDefaultProjectRoot()): string {
  return path.join(getSkillsDir(root), 'skills.json');
}

export async function loadImportedSkills(root = getDefaultProjectRoot()): Promise<ImportedSkill[]> {
  try {
    const raw = await fs.readFile(getSkillsRegistryPath(root), 'utf8');
    return z.array(ImportedSkillSchema).parse(JSON.parse(raw));
  } catch {
    return [];
  }
}

export async function saveImportedSkills(skills: ImportedSkill[], root = getDefaultProjectRoot()): Promise<void> {
  await fs.mkdir(getSkillsDir(root), { recursive: true });
  await fs.writeFile(getSkillsRegistryPath(root), JSON.stringify(skills, null, 2));
}

export async function upsertImportedSkill(skill: ImportedSkill, root = getDefaultProjectRoot()): Promise<void> {
  const skills = await loadImportedSkills(root);
  const existing = skills.findIndex((item) => item.id === skill.id);
  if (existing >= 0) skills[existing] = skill;
  else skills.push(skill);
  await saveImportedSkills(skills, root);
}

export async function removeImportedSkill(id: string, root = getDefaultProjectRoot()): Promise<boolean> {
  const skills = await loadImportedSkills(root);
  const next = skills.filter((item) => item.id !== id);
  const changed = next.length !== skills.length;
  if (changed) await saveImportedSkills(next, root);
  return changed;
}
