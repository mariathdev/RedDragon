import { REST, Routes } from 'discord.js';
import { readdir } from 'fs/promises';
import { pathToFileURL } from 'url';
import path from 'path';
import { env } from '../src/config/environment.js';

async function collectFiles(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files   = [];
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory())             files.push(...await collectFiles(full));
        else if (entry.name.endsWith('.js')) files.push(full);
    }
    return files;
}

async function deploy() {
    const files    = await collectFiles(path.resolve('src/commands'));
    const commands = [];

    for (const file of files) {
        const url = pathToFileURL(file).href;
        const mod = await import(url);
        if (!mod.data) continue;
        commands.push(mod.data.toJSON());
        console.log(`  Preparado: /${mod.data.name}`);
    }

    const rest = new REST({ version: '10' }).setToken(env.token);
    console.log(`Registering ${commands.length} command(s) in server ${env.guildId}...`);

    const result = await rest.put(
        Routes.applicationGuildCommands(env.clientId, env.guildId),
        { body: commands },
    );

    console.log(`Done. ${result.length} command(s) registered.`);
}

deploy().catch((err) => {
    console.error('Deploy failed:', err);
    process.exit(1);
});
