import { readdir } from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';

export async function collectJavaScriptFiles(dir) {
    const entries = (await readdir(dir, { withFileTypes: true }))
        .sort((left, right) => left.name.localeCompare(right.name));
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...await collectJavaScriptFiles(fullPath));
            continue;
        }

        if (entry.name.endsWith('.js')) {
            files.push(fullPath);
        }
    }

    return files;
}

export async function importModule(filePath) {
    return import(pathToFileURL(filePath).href);
}
