import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { collectJavaScriptFiles } from '../src/utils/moduleLoader.js';

const roots = ['src', 'scripts'];
let exitCode = 0;

for (const root of roots) {
    const absoluteRoot = path.resolve(root);
    const files = await collectJavaScriptFiles(absoluteRoot);

    for (const file of files) {
        const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
        if (result.status) {
            exitCode = result.status;
        }
    }
}

process.exit(exitCode);
