import { REST, Routes } from "discord.js";
import { verificarCommand } from "./commands/verificar.js";
import { dniCommand } from "./commands/dni.js";
import { verDniCommand } from "./commands/ver-dni.js";

const token    = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token)    throw new Error("DISCORD_TOKEN env var is required");
if (!clientId) throw new Error("DISCORD_CLIENT_ID env var is required");

const rest = new REST({ version: "10" }).setToken(token);

const commands = [
  verificarCommand.toJSON(),
  dniCommand.toJSON(),
  verDniCommand.toJSON(),
];

(async () => {
  try {
    console.log("Registrando comandos de barra (/)...");
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log("Comandos registrados correctamente.");
  } catch (err) {
    console.error(err);
  }
})();
