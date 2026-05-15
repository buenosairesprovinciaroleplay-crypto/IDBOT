import {
  Client,
  GatewayIntentBits,
  Collection,
  ChatInputCommandInteraction,
  ButtonInteraction,
  AttachmentBuilder,
} from "discord.js";
import { verificarHandler } from "./commands/verificar.js";
import { dniHandler } from "./commands/dni.js";
import { verDniHandler } from "./commands/ver-dni.js";
import { getUser } from "./db.js";
import { buildBack, type CardOptions } from "./cardBuilder.js";

const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error("DISCORD_TOKEN env var is required");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = new Collection<string, { execute: (i: ChatInputCommandInteraction) => Promise<void> }>();
commands.set("verificar", { execute: verificarHandler });
commands.set("dni",       { execute: dniHandler });
commands.set("ver-dni",   { execute: verDniHandler });

// ── Handler del botón "Ver Reverso" ───────────────────────────────────────────
async function handleReversoButton(interaction: ButtonInteraction): Promise<void> {
  const targetDiscordId = interaction.customId.split(":")[1];

  if (!targetDiscordId) {
    await interaction.reply({ content: "ID inválido.", ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const user = getUser(targetDiscordId);
  if (
    !user ||
    !user.primerNombre || !user.primerApellido ||
    !user.nacionalidad || !user.fechaNacimiento
  ) {
    await interaction.editReply({ content: "No se encontraron datos de identificación." });
    return;
  }

  const opts: CardOptions = {
    primerNombre:    user.primerNombre,
    segundoNombre:   user.segundoNombre   ?? "",
    primerApellido:  user.primerApellido,
    segundoApellido: user.segundoApellido ?? "",
    nacionalidad:    user.nacionalidad,
    fechaNacimiento: user.fechaNacimiento,
    sexo:            user.sexo            ?? "M",
    robloxId:        user.robloxId,
    robloxUsername:  user.robloxUsername,
  };

  const backBuf = await buildBack(opts);

  await interaction.editReply({
    content: "**Reverso del documento:**",
    files: [new AttachmentBuilder(backBuf, { name: "dni_reverso.png" })],
  });
}

client.once("clientReady", () => {
  console.log(`Bot listo: ${client.user?.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  // ── Botón ────────────────────────────────────────────────────────────────────
  if (interaction.isButton()) {
    if (interaction.customId.startsWith("dni_reverso:")) {
      try {
        await handleReversoButton(interaction);
      } catch (err) {
        console.error(err);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: "Error al generar el reverso.", ephemeral: true });
        }
      }
    }
    return;
  }

  // ── Comandos slash ────────────────────────────────────────────────────────────
  if (!interaction.isChatInputCommand()) return;
  const cmd = commands.get(interaction.commandName);
  if (!cmd) return;
  try {
    await cmd.execute(interaction);
  } catch (err) {
    console.error(err);
    const reply = { content: "Ocurrió un error al ejecutar el comando.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

client.login(token);
