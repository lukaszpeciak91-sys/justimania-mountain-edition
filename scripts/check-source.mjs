import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

function JavaScriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return JavaScriptFiles(path);
    return entry.name.endsWith('.js') ? [path] : [];
  });
}

JavaScriptFiles('src').forEach((path) => execFileSync(process.execPath, ['--check', path], { stdio: 'inherit' }));
