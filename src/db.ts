import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "../data/users.json");

export interface UserRecord {
  discordId: string;
  robloxId: number;
  robloxUsername: string;
  verifiedAt: string;
  // Campos DNI (opcionales para compatibilidad con registros existentes)
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  nacionalidad?: string;
  fechaNacimiento?: string;
  sexo?: string;
}

export type DB = Record<string, UserRecord>;

function readDb(): DB {
  if (!existsSync(DB_PATH)) return {};
  return JSON.parse(readFileSync(DB_PATH, "utf-8")) as DB;
}

function writeDb(db: DB): void {
  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function getUser(discordId: string): UserRecord | null {
  const db = readDb();
  return db[discordId] ?? null;
}

export function saveUser(record: UserRecord): void {
  const db = readDb();
  db[record.discordId] = record;
  writeDb(db);
}

export function updateDNI(
  discordId: string,
  fields: Partial<Pick<UserRecord,
    "primerNombre" | "segundoNombre" | "primerApellido" | "segundoApellido" |
    "nacionalidad" | "fechaNacimiento" | "sexo"
  >>
): void {
  const db = readDb();
  if (!db[discordId]) return;
  db[discordId] = { ...db[discordId], ...fields };
  writeDb(db);
}
