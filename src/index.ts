import {
  Client,
  GatewayIntentBits,
  Collection,
  ChatInputCommandInteraction,
} from "discord.js";

import { verificarHandler } from "./commands/verificar.js";
import { dniHandler } from "./commands/dni.js";
import { verDniHandler } from "./commands/ver-dni.js";

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error("DISCORD_TOKEN env var is required");
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const commands = new Collection<
  string,
  { execute: (i: ChatInputCommandInteraction) => Promise<void> }
>();

commands.set("verificar", { execute: verificarHandler });
commands.set("dni", { execute: dniHandler });
commands.set("ver-dni", { execute: verDniHandler });

client.once("clientReady", () => {
  console.log(`Bot listo: ${client.user?.tag}`);

  client.user?.setPresence({
    activities: [
      {
        name: "Sistema de Identificación",
        type: 0,
      },
    ],
    status: "online",
  });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = commands.get(interaction.commandName);

  if (!cmd) return;

  try {
    await cmd.execute(interaction);
  } catch (err) {
    console.error(err);

    const reply = {
      content: "Ocurrió un error al ejecutar el comando.",
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

client.login(token);
