import { createCanvas, loadImage, type SKRSContext2D } from "@napi-rs/canvas";

export interface CardOptions {
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  nacionalidad: string;
  fechaNacimiento: string;
  sexo: string;
  robloxId: number;
  robloxUsername: string;
}

const WIDTH = 900;
const HEIGHT = 540;

const COLORS = {
  navy: "#14213d",
  gold: "#d4a017",
  cream: "#f4ecd8",
  dark: "#111111",
  light: "#ffffff",
  blue: "#3566c7",
};

function calculateAge(dateString: string): number {
  const [day, month, year] = dateString.split("/").map(Number);

  if (!day || !month || !year) return 0;

  const birth = new Date(year, month - 1, day);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const m = today.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

function drawBackground(ctx: SKRSContext2D) {
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = "rgba(120,120,120,0.08)";
  ctx.lineWidth = 1;

  for (let i = -HEIGHT; i < WIDTH; i += 18) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + HEIGHT, HEIGHT);
    ctx.stroke();
  }
}

function drawHeader(ctx: SKRSContext2D) {
  ctx.fillStyle = COLORS.navy;
  ctx.fillRect(0, 0, WIDTH, 95);

  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(0, 95, WIDTH, 4);

  ctx.fillStyle = COLORS.light;
  ctx.font = "bold 52px Arial";
  ctx.textAlign = "right";
  ctx.fillText("BUENOS AIRES", WIDTH - 25, 58);

  ctx.fillStyle = COLORS.gold;
  ctx.font = "bold 17px Arial";
  ctx.fillText("TARJETA DE IDENTIFICACIÓN", WIDTH - 25, 83);

  ctx.textAlign = "left";
}

function drawFooter(ctx: SKRSContext2D, fullName: string) {
  ctx.fillStyle = COLORS.navy;
  ctx.fillRect(0, HEIGHT - 52, WIDTH, 52);

  ctx.fillStyle = COLORS.light;
  ctx.font = "bold 20px Arial";

  ctx.fillText(fullName.toUpperCase(), 20, HEIGHT - 18);

  ctx.fillStyle = COLORS.gold;

  ctx.beginPath();
  ctx.ellipse(WIDTH - 55, HEIGHT - 27, 28, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = COLORS.navy;
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "center";
  ctx.fillText("BA", WIDTH - 55, HEIGHT - 21);

  ctx.textAlign = "left";
}

function drawField(
  ctx: SKRSContext2D,
  label: string,
  value: string,
  x: number,
  y: number
) {
  ctx.fillStyle = COLORS.blue;
  ctx.font = "bold 11px Arial";
  ctx.fillText(label, x, y);

  ctx.fillStyle = COLORS.dark;
  ctx.font = "bold 25px Arial";
  ctx.fillText(value, x, y + 30);

  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(x, y + 42);
  ctx.lineTo(860, y + 42);
  ctx.stroke();
}

async function getAvatar(robloxId: number): Promise<string> {
  try {
    const response = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar?userIds=${robloxId}&size=420x420&format=Png&isCircular=false`
    );

    const json = (await response.json()) as {
      data: { imageUrl: string }[];
    };

    return json.data[0]?.imageUrl ?? "";
  } catch {
    return "";
  }
}

export async function buildFront(
  options: CardOptions
): Promise<Buffer> {
  const {
    primerNombre,
    segundoNombre,
    primerApellido,
    segundoApellido,
    nacionalidad,
    fechaNacimiento,
    robloxId,
    robloxUsername,
  } = options;

  const fullName =
    `${primerNombre}` +
    `${segundoNombre ? " " + segundoNombre : ""} ` +
    `${primerApellido}` +
    `${segundoApellido ? " " + segundoApellido : ""}`;

  const age = calculateAge(fechaNacimiento);

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  drawBackground(ctx);
  drawHeader(ctx);
  drawFooter(ctx, fullName);

  // ── Avatar ────────────────────────────────────────────────────────────────
  const avatarX = 25;
  const avatarY = 120;
  const avatarW = 250;
  const avatarH = 340;

  ctx.fillStyle = "#d8d1bb";
  ctx.fillRect(avatarX, avatarY, avatarW, avatarH);

  const avatarUrl = await getAvatar(robloxId);

  if (avatarUrl) {
    try {
      const img = await loadImage(avatarUrl);

      const scale = Math.min(
        avatarW / img.width,
        avatarH / img.height
      );

      const width = img.width * scale;
      const height = img.height * scale;

      const x = avatarX + (avatarW - width) / 2;
      const y = avatarY + (avatarH - height) / 2;

      ctx.drawImage(img, x, y, width, height);
    } catch {}
  }

  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 4;
  ctx.strokeRect(avatarX, avatarY, avatarW, avatarH);

  // ── Datos ────────────────────────────────────────────────────────────────
  const startX = 320;

  let y = 135;

  drawField(ctx, "NOMBRE COMPLETO", fullName, startX, y);

  y += 70;

  drawField(
    ctx,
    "FECHA DE NACIMIENTO",
    fechaNacimiento,
    startX,
    y
  );

  y += 70;

  drawField(ctx, "EDAD", `${age} años`, startX, y);

  y += 70;

  drawField(ctx, "NACIONALIDAD", nacionalidad, startX, y);

  y += 70;

  drawField(
    ctx,
    "USUARIO DE ROBLOX",
    robloxUsername,
    startX,
    y
  );

  y += 70;

  drawField(
    ctx,
    "NÚMERO DE IDENTIFICACIÓN",
    String(robloxId),
    startX,
    y
  );

  return canvas.encode("png");
}
