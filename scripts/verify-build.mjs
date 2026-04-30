import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const packageJsonPath = path.join(root, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const expectedBinPath = 'dist/src/cli.js';
if (packageJson.bin?.rocketclaw2 !== expectedBinPath) {
  throw new Error(`package.json bin.rocketclaw2 must point to ${expectedBinPath}, found: ${packageJson.bin?.rocketclaw2 ?? '<missing>'}`);
}

const builtCliPath = path.join(root, expectedBinPath);
if (!fs.existsSync(builtCliPath)) {
  throw new Error(`Built CLI entrypoint missing: ${expectedBinPath}. Run npm run build first.`);
}

const staleLegacyCliPath = path.join(root, 'dist', 'cli.js');
if (fs.existsSync(staleLegacyCliPath)) {
  throw new Error('Stale legacy CLI artifact detected at dist/cli.js. Build output should only expose dist/src/cli.js.');
}

const mode = fs.statSync(builtCliPath).mode & 0o777;
if ((mode & 0o111) === 0) {
  throw new Error(`Built CLI entrypoint is not executable: ${expectedBinPath} (mode ${mode.toString(8)})`);
}

const helpOutput = execFileSync('node', [builtCliPath, '--help'], {
  cwd: root,
  encoding: 'utf8',
});

for (const command of ['workspace-status', 'config-show', 'whatsapp-session', 'harness-run', 'harness-run-plan', 'auto-code']) {
  if (!helpOutput.includes(command)) {
    throw new Error(`Built CLI help is missing expected command: ${command}`);
  }
}

console.log('Build verification passed: canonical CLI entrypoint is intact and stale legacy artifacts are absent.');
