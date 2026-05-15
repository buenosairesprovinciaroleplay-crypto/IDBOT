import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from "discord.js";
import { getUser, updateDNI } from "../db.js";
import { buildFront, type CardOptions } from "../cardBuilder.js";

export const dniCommand = new SlashCommandBuilder()
  .setName("dni")
  .setDescription("Genera tu Documento de Identificación")
  .addStringOption((o) =>
    o.setName("primer_apellido").setDescription("Primer apellido").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("primer_nombre").setDescription("Primer nombre").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("nacionalidad").setDescription("Nacionalidad (ej: ARGENTINA)").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("fecha_nacimiento")
      .setDescription("Fecha de nacimiento (DD/MM/AAAA)")
      .setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("segundo_apellido").setDescription("Segundo apellido (opcional)").setRequired(false)
  )
  .addStringOption((o) =>
    o.setName("segundo_nombre").setDescription("Segundo nombre (opcional)").setRequired(false)
  )
  .addStringOption((o) =>
    o.setName("sexo")
      .setDescription("Sexo")
      .setRequired(false)
      .addChoices(
        { name: "M — Masculino", value: "M" },
        { name: "F — Femenino", value: "F" },
        { name: "X — No binario", value: "X" }
      )
  );

export async function dniHandler(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  await interaction.deferReply();

  const user = getUser(interaction.user.id);
  if (!user) {
    await interaction.editReply({
      content: "No estás verificado. Usa `/verificar <usuario>` primero para vincular tu cuenta de Roblox.",
    });
    return;
  }

  const primerApellido = interaction.options.getString("primer_apellido", true);
  const primerNombre = interaction.options.getString("primer_nombre", true);
  const nacionalidad = interaction.options.getString("nacionalidad", true);
  const fechaNacimiento = interaction.options.getString("fecha_nacimiento", true);
  const segundoApellido = interaction.options.getString("segundo_apellido") ?? "";
  const segundoNombre = interaction.options.getString("segundo_nombre") ?? "";
  const sexo = interaction.options.getString("sexo") ?? "M";

  updateDNI(interaction.user.id, {
    primerNombre,
    segundoNombre,
    primerApellido,
    segundoApellido,
    nacionalidad,
    fechaNacimiento,
    sexo,
  });

  const opts: CardOptions = {
    primerNombre,
    segundoNombre,
    primerApellido,
    segundoApellido,
    nacionalidad,
    fechaNacimiento,
    sexo,
    robloxId: user.robloxId,
    robloxUsername: user.robloxUsername,
  };

  const frontBuf = await buildFront(opts);
  const fullName = `${primerNombre}${segundoNombre ? " " + segundoNombre : ""} ${primerApellido}${segundoApellido ? " " + segundoApellido : ""}`.trim();

  const button = new ButtonBuilder()
    .setCustomId(`dni_reverso:${interaction.user.id}`)
    .setLabel("🔄 Ver Reverso")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  await interaction.editReply({
    content: `**Identificación generada para ${fullName}** (\`${user.robloxUsername}\`)`,
    files: [new AttachmentBuilder(frontBuf, { name: "dni_frente.png" })],
    components: [row],
  });
}
