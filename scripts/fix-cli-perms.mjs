import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const cliPath = path.join(root, 'dist', 'src', 'cli.js');

if (!fs.existsSync(cliPath)) {
  throw new Error(`CLI entrypoint not found: ${cliPath}`);
}

fs.chmodSync(cliPath, 0o755);
console.log(`Set executable permissions on ${path.relative(root, cliPath)}`);
