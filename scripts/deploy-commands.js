import { REST, Routes } from 'discord.js';
import path from 'path';
import { env } from '../src/config/environment.js';
import { collectJavaScriptFiles, importModule } from '../src/utils/moduleLoader.js';

async function deploy() {
    const files = await collectJavaScriptFiles(path.resolve('src/commands'));
    const commands = [];

    for (const file of files) {
        const mod = await importModule(file);
        if (!mod.data) continue;
        commands.push(mod.data.toJSON());
        console.log(`  Prepared: /${mod.data.name}`);
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
