import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import noblox from "noblox.js";
import { saveUser } from "../db.js";

export const verificarCommand = new SlashCommandBuilder()
  .setName("verificar")
  .setDescription("Vincula tu cuenta de Discord con tu cuenta de Roblox")
  .addStringOption((opt) =>
    opt
      .setName("usuario")
      .setDescription("Tu nombre de usuario en Roblox")
      .setRequired(true)
  );

export async function verificarHandler(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const username = interaction.options.getString("usuario", true);

  let robloxId: number;
  try {
    robloxId = await noblox.getIdFromUsername(username);
  } catch {
    await interaction.editReply({
      content: `No encontré el usuario de Roblox **${username}**. Verifica que esté escrito correctamente.`,
    });
    return;
  }

  let robloxUsername: string;
  try {
    robloxUsername = await noblox.getUsernameFromId(robloxId);
  } catch {
    robloxUsername = username;
  }

  saveUser({
    discordId: interaction.user.id,
    robloxId,
    robloxUsername,
    verifiedAt: new Date().toISOString(),
  });

  const embed = new EmbedBuilder()
    .setColor(0x00c853)
    .setTitle("✅ Verificación exitosa")
    .setDescription(
      `Tu cuenta de Discord quedó vinculada con **${robloxUsername}** (ID: \`${robloxId}\`).`
    )
    .setThumbnail(
      `https://www.roblox.com/headshot-thumbnail/image?userId=${robloxId}&width=150&height=150&format=png`
    )
    .setFooter({ text: "Usa /dni para generar tu tarjeta de identidad." })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
