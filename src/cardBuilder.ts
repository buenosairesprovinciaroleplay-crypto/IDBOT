import { createCanvas, loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import bwipjs from "bwip-js";

// ── Paleta ───────────────────────────────────────────────────────────────────
export const NAVY   = "#1a3560";
export const GOLD   = "#c8a030";
export const BEIGE  = "#e5dab8";
export const TEXT   = "#1a3560";
export const WHITE  = "#ffffff";

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
  if (mo < 0 || (mo === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function diagonalPattern(ctx: SKRSContext2D, x: number, y: number, w: number, h: number) {
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
  // Fondo del encabezado
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, W, 92);

  // Fila de flechas decorativas
  ctx.fillStyle = WHITE;
  ctx.font = "bold 18px sans-serif";
  const arrows = "↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓";
  ctx.fillText(arrows, 22, 38);

  // Título "BUENOS AIRES"
  ctx.textAlign = "right";
  ctx.font = "bold 50px sans-serif";
  ctx.fillStyle = WHITE;
  ctx.fillText("BUENOS AIRES", W - 24, 58);

  // Subtítulo en dorado
  ctx.font = "bold 15px sans-serif";
  ctx.fillStyle = GOLD;
  ctx.fillText(subtitle.toUpperCase(), W - 24, 82);

  ctx.textAlign = "left";

  // Línea dorada separadora
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 92, W, 4);
}

function drawFooter(ctx: SKRSContext2D, fullName: string) {
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, H - 52, W, 52);

  ctx.fillStyle = WHITE;
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(fullName.toUpperCase(), 22, H - 18);

  // Oval "LA"
  const ox = W - 70;
  const oy = H - 44;
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.ellipse(ox, oy + 20, 32, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = NAVY;
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("BA", ox, oy + 27);

  ctx.textAlign = "left";
}

function goldBrackets(ctx: SKRSContext2D, x: number, y: number, w: number, h: number, len = 22) {
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  // top-left
  ctx.beginPath(); ctx.moveTo(x + len, y); ctx.lineTo(x, y); ctx.lineTo(x, y + len); ctx.stroke();
  // top-right
  ctx.beginPath(); ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len); ctx.stroke();
  // bottom-left
  ctx.beginPath(); ctx.moveTo(x, y + h - len); ctx.lineTo(x, y + h); ctx.lineTo(x + len, y + h); ctx.stroke();
  // bottom-right
  ctx.beginPath(); ctx.moveTo(x + w - len, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - len); ctx.stroke();
}

function fieldRow(
  ctx: SKRSContext2D,
  label: string, value: string,
  x: number, y: number,
  labelSize = 10, valueSize = 22
) {
  ctx.font = `bold ${labelSize}px sans-serif`;
  ctx.fillStyle = "#4472c4";
  ctx.fillText(label, x, y);

  ctx.font = `${valueSize}px sans-serif`;
  ctx.fillStyle = TEXT;
  ctx.fillText(value, x, y + valueSize + 2);

  return y + valueSize + 18; // next y
}

// ── Avatar ────────────────────────────────────────────────────────────────────
async function getAvatarUrl(robloxId: number): Promise<string> {
  try {
    const res = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar?userIds=${robloxId}&size=420x420&format=Png&isCircular=false`
    );
    const json = await res.json() as { data: { imageUrl: string }[] };
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
    primerNombre, segundoNombre, primerApellido, segundoApellido,
    nacionalidad, fechaNacimiento, robloxId, robloxUsername,
  } = opts;

  const fullName  = `${primerNombre}${segundoNombre ? " " + segundoNombre : ""} ${primerApellido}${segundoApellido ? " " + segundoApellido : ""}`;
  const age       = calcAge(fechaNacimiento);

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext("2d");

  // Fondo beige base
  ctx.fillStyle = BEIGE;
  ctx.fillRect(0, 0, W, H);
  diagonalPattern(ctx, 0, 96, W, H - 96 - 52);

  // Header y footer
  drawHeader(ctx, "TARJETA DE IDENTIFICACIÓN");
  drawFooter(ctx, fullName);

  // ── Panel del avatar ────────────────────────────────────────────────────────
  const AX = 18, AY = 108, AW = 262, AH = H - 108 - 52 - 10;

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
    } catch { /* sin avatar */ }
  }

  goldBrackets(ctx, AX, AY, AW, AH);

  // ── Panel de campos ─────────────────────────────────────────────────────────
  const FX = 302;
  let fy = 118;
  const gap = 14;

  fy = fieldRow(ctx, "NOMBRE COMPLETO", fullName, FX, fy, 10, 26) + gap;
  fy = fieldRow(ctx, "FECHA DE NACIMIENTO", fechaNacimiento, FX, fy, 10, 22) + gap;
  fy = fieldRow(ctx, "EDAD", `${age} años`, FX, fy, 10, 22) + gap;
  fy = fieldRow(ctx, "NACIONALIDAD", nacionalidad, FX, fy, 10, 22) + gap;
  fy = fieldRow(ctx, "USUARIO DE ROBLOX", robloxUsername, FX, fy, 10, 22) + gap;
       fieldRow(ctx, "N.° DE IDENTIFICACIÓN", String(robloxId), FX, fy, 10, 22);

  // Líneas divisoras entre campos
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

// ── PARTE TRASERA ─────────────────────────────────────────────────────────────
export async function buildBack(opts: CardOptions): Promise<Buffer> {
  const {
    primerNombre, primerApellido, segundoNombre, segundoApellido,
    robloxId,
  } = opts;

  const fullName = `${primerNombre}${segundoNombre ? " " + segundoNombre : ""} ${primerApellido}${segundoApellido ? " " + segundoApellido : ""}`;
  const signName = `${primerNombre} ${primerApellido}`;

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext("2d");

  // Fondo beige
  ctx.fillStyle = BEIGE;
  ctx.fillRect(0, 0, W, H);
  diagonalPattern(ctx, 0, 96, W, H - 96 - 52);

  // Header y footer
  drawHeader(ctx, "REVERSO DEL DOCUMENTO");
  drawFooter(ctx, fullName);

  // Banda magnética negra
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 96, W, 38);

  // ── FIRMA DEL TITULAR ────────────────────────────────────────────────────────
  const LX = 40;
  ctx.fillStyle = "#4472c4";
  ctx.font = "bold 10px sans-serif";
  ctx.fillText("FIRMA DEL TITULAR", LX, 162);

  // Caja blanca de firma
  const SX = LX, SY = 172, SW = 420, SH = 90;
  ctx.fillStyle = WHITE;
  ctx.fillRect(SX, SY, SW, SH);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(SX, SY, SW, SH);

  // Firma en cursiva
  ctx.fillStyle = "#1a3580";
  ctx.font = "italic bold 54px serif";
  ctx.fillText(signName, SX + 16, SY + 64);

  // ── CÓDIGO DE BARRAS + QR ─────────────────────────────────────────────────────
  ctx.fillStyle = "#4472c4";
  ctx.font = "bold 10px sans-serif";
  ctx.fillText("CÓDIGO DE BARRAS", LX, 288);

  const profileUrl = `https://www.roblox.com/users/${robloxId}/profile`;
  const QR_SIZE = 75;
  const QR_X   = W - QR_SIZE - 30;
  const QR_Y   = 170;

  // QR pequeño a la derecha
  try {
    const qrBuf = (await bwipjs.toBuffer({
      bcid: "qrcode",
      text: profileUrl,
      scale: 2,
    })) as Buffer;
    const qrImg = await loadImage(qrBuf);
    ctx.drawImage(qrImg, QR_X, QR_Y, QR_SIZE, QR_SIZE);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1;
    ctx.strokeRect(QR_X, QR_Y, QR_SIZE, QR_SIZE);

    ctx.fillStyle = "rgba(26,53,96,0.6)";
    ctx.font = "bold 8px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PERFIL ROBLOX", QR_X + QR_SIZE / 2, QR_Y + QR_SIZE + 12);
    ctx.textAlign = "left";
  } catch { /* sin QR */ }

  try {
    const barBuf = (await bwipjs.toBuffer({
      bcid: "code128",
      text: String(robloxId),
      scale: 2,
      height: 22,
      includetext: false,
    })) as Buffer;
    const barImg = await loadImage(barBuf);
    const barW   = 300;
    const barH   = Math.round(barImg.height * (barW / barImg.width));
    ctx.drawImage(barImg, LX, 298, barW, barH);

    ctx.fillStyle = TEXT;
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    const idStr = String(robloxId);
    const spaced = idStr.replace(/(\d{2})(?=\d)/g, "$1 ");
    ctx.fillText(spaced, LX + barW / 2, 298 + barH + 18);
    ctx.textAlign = "left";
  } catch { /* sin código de barras */ }

  // ── Texto legal ───────────────────────────────────────────────────────────────
  ctx.fillStyle = "rgba(26,53,96,0.7)";
  ctx.font = "italic 11px sans-serif";
  ctx.fillText("Este documento es propiedad de la Ciudad de Buenos Aires.", LX, 430);
  ctx.fillText("No válido como identificación federal. Exclusivo para uso local.", LX, 446);

  return canvas.encode("png");
}
