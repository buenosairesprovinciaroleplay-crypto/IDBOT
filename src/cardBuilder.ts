import { createCanvas, loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import bwipjs from "bwip-js";

// ── Paleta ───────────────────────────────────────────────────────────────────
export const NAVY = "#1a3560";
export const GOLD = "#c8a030";
export const BEIGE = "#e5dab8";
export const TEXT = "#1a3560";
export const WHITE = "#ffffff";

const W = 900;
const H = 540;

// ── Utilidades ────────────────────────────────────────────────────────────────
function calcAge(dateStr: string): number {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return 0;

  const [d, m, y] = parts.map(Number);

  if (!d || !m || !y) return 0;

  const birth = new Date(y, m - 1, d);
  const now = new Date();

  let age = now.getFullYear() - birth.getFullYear();

  const mo = now.getMonth() - birth.getMonth();

  if (mo < 0 || (mo === 0 && now.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

function diagonalPattern(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();

  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  ctx.strokeStyle = "rgba(160,140,80,0.18)";
  ctx.lineWidth = 1;

  const step = 14;

  for (let i = -(h + w); i < w + h; i += step) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i + h, y + h);
    ctx.stroke();
  }

  ctx.restore();
}

function drawHeader(ctx: SKRSContext2D, subtitle: string) {
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, W, 92);

  ctx.fillStyle = WHITE;
  ctx.font = "bold 18px Arial";
  ctx.fillText("↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓", 22, 38);

  ctx.textAlign = "right";

  ctx.font = "bold 50px Arial";
  ctx.fillStyle = WHITE;
  ctx.fillText("BUENOS AIRES", W - 24, 58);

  ctx.font = "bold 15px Arial";
  ctx.fillStyle = GOLD;
  ctx.fillText(subtitle.toUpperCase(), W - 24, 82);

  ctx.textAlign = "left";

  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 92, W, 4);
}

function drawFooter(ctx: SKRSContext2D, fullName: string) {
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, H - 52, W, 52);

  ctx.fillStyle = WHITE;
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "left";

  ctx.fillText(fullName.toUpperCase(), 22, H - 18);

  const ox = W - 70;
  const oy = H - 44;

  ctx.fillStyle = GOLD;

  ctx.beginPath();
  ctx.ellipse(ox, oy + 20, 32, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = NAVY;
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "center";

  ctx.fillText("BA", ox, oy + 27);

  ctx.textAlign = "left";
}

function goldBrackets(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  len = 22
) {
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(x + len, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + len);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + w - len, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + len);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y + h - len);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + len, y + h);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + w - len, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y + h - len);
  ctx.stroke();
}

function fieldRow(
  ctx: SKRSContext2D,
  label: string,
  value: string,
  x: number,
  y: number,
  labelSize = 10,
  valueSize = 22
) {
  ctx.font = `bold ${labelSize}px Arial`;
  ctx.fillStyle = "#4472c4";
  ctx.fillText(label, x, y);

  ctx.font = `bold ${valueSize}px Arial`;
  ctx.fillStyle = "#111111";
  ctx.fillText(value, x, y + valueSize + 2);

  return y + valueSize + 18;
}

// ── Avatar ────────────────────────────────────────────────────────────────────
async function getAvatarUrl(robloxId: number): Promise<string> {
  try {
    const res = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar?userIds=${robloxId}&size=420x420&format=Png&isCircular=false`
    );

    const json = (await res.json()) as {
      data: { imageUrl: string }[];
    };

    return json.data[0]?.imageUrl ?? "";
  } catch {
    return "";
  }
}

// ── PARTE DELANTERA ───────────────────────────────────────────────────────────
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

export async function buildFront(opts: CardOptions): Promise<Buffer> {
  const {
    primerNombre,
    segundoNombre,
    primerApellido,
    segundoApellido,
    nacionalidad,
    fechaNacimiento,
    robloxId,
    robloxUsername,
  } = opts;

  const fullName = `${primerNombre}${
    segundoNombre ? " " + segundoNombre : ""
  } ${primerApellido}${
    segundoApellido ? " " + segundoApellido : ""
  }`;

  const age = calcAge(fechaNacimiento);

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = BEIGE;
  ctx.fillRect(0, 0, W, H);

  diagonalPattern(ctx, 0, 96, W, H - 96 - 52);

  drawHeader(ctx, "TARJETA DE IDENTIFICACIÓN");
  drawFooter(ctx, fullName);

  const AX = 18;
  const AY = 108;
  const AW = 262;
  const AH = H - 108 - 52 - 10;

  ctx.fillStyle = "#ddd5b0";
  ctx.fillRect(AX, AY, AW, AH);

  const avatarUrl = await getAvatarUrl(robloxId);

  if (avatarUrl) {
    try {
      const img = await loadImage(avatarUrl);

      const scale = Math.min(AW / img.width, AH / img.height);

      const iw = Math.round(img.width * scale);
      const ih = Math.round(img.height * scale);

      const ix = AX + Math.round((AW - iw) / 2);
      const iy = AY + Math.round((AH - ih) / 2);

      ctx.drawImage(img, ix, iy, iw, ih);
    } catch {}
  }

  goldBrackets(ctx, AX, AY, AW, AH);

  const FX = 302;

  let fy = 118;
  const gap = 14;

  fy = fieldRow(ctx, "NOMBRE COMPLETO", fullName, FX, fy, 10, 26) + gap;

  fy =
    fieldRow(
      ctx,
      "FECHA DE NACIMIENTO",
      fechaNacimiento,
      FX,
      fy,
      10,
      22
    ) + gap;

  fy = fieldRow(ctx, "EDAD", `${age} años`, FX, fy, 10, 22) + gap;

  fy =
    fieldRow(ctx, "NACIONALIDAD", nacionalidad, FX, fy, 10, 22) + gap;

  fy =
    fieldRow(
      ctx,
      "USUARIO DE ROBLOX",
      robloxUsername,
      FX,
      fy,
      10,
      22
    ) + gap;

  fieldRow(
    ctx,
    "N.° DE IDENTIFICACIÓN",
    String(robloxId),
    FX,
    fy,
    10,
    22
  );

  ctx.strokeStyle = "rgba(100,114,196,0.25)";
  ctx.lineWidth = 1;

  let lineY = 148;

  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(FX, lineY);
    ctx.lineTo(W - 18, lineY);
    ctx.stroke();

    lineY += 72;
  }

  return canvas.encode("png");
}
