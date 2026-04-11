import { execFileSync } from 'node:child_process';

const stdout = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
  cwd: process.cwd(),
  encoding: 'utf8',
});

const parsed = JSON.parse(stdout);
const packResult = Array.isArray(parsed) ? parsed[0] : parsed;
const files = (packResult.files ?? []).map((entry) => entry.path);

const required = ['package.json', 'README.md', 'dist/src/cli.js'];
for (const path of required) {
  if (!files.includes(path)) {
    throw new Error(`Packed artifact is missing required file: ${path}`);
  }
}

for (const path of files) {
  if (
    path.startsWith('tests/') ||
    path.startsWith('src/') ||
    path.startsWith('node_modules/') ||
    path.startsWith('dist/tests/') ||
    path.startsWith('dist/config/') ||
    path === 'dist/cli.js'
  ) {
    throw new Error(`Packed artifact includes unexpected development or legacy file: ${path}`);
  }
}

console.log(`Pack verification passed: ${files.length} publishable files, no src/tests leakage, canonical dist/src CLI included.`);
