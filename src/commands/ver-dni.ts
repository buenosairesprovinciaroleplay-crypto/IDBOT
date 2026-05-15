import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from "discord.js";
import { getUser } from "../db.js";
import { buildFront, type CardOptions } from "../cardBuilder.js";

export const verDniCommand = new SlashCommandBuilder()
  .setName("ver-dni")
  .setDescription("Muestra tu identificación ya creada");

export async function verDniHandler(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  await interaction.deferReply();

  const user = getUser(interaction.user.id);

  if (!user) {
    await interaction.editReply({
      content: "No estás verificado. Usa `/verificar <usuario>` primero.",
    });
    return;
  }

  const {
    primerNombre,
    segundoNombre,
    primerApellido,
    segundoApellido,
    nacionalidad,
    fechaNacimiento,
    sexo,
    robloxId,
    robloxUsername,
  } = user;

  if (!primerNombre || !primerApellido || !nacionalidad || !fechaNacimiento) {
    await interaction.editReply({
      content: "Todavía no tienes una identificación creada. Usa `/dni` para generarla.",
    });
    return;
  }

  const opts: CardOptions = {
    primerNombre,
    segundoNombre: segundoNombre ?? "",
    primerApellido,
    segundoApellido: segundoApellido ?? "",
    nacionalidad,
    fechaNacimiento,
    sexo: sexo ?? "M",
    robloxId,
    robloxUsername,
  };

  const frontBuf = await buildFront(opts);
  const fullName = `${primerNombre}${segundoNombre ? " " + segundoNombre : ""} ${primerApellido}${segundoApellido ? " " + segundoApellido : ""}`.trim();

  const button = new ButtonBuilder()
    .setCustomId(`dni_reverso:${interaction.user.id}`)
    .setLabel("🔄 Ver Reverso")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  await interaction.editReply({
    content: `**Identificación de ${fullName}** (\`${robloxUsername}\`)`,
    files: [new AttachmentBuilder(frontBuf, { name: "dni_frente.png" })],
    components: [row],
  });
}
