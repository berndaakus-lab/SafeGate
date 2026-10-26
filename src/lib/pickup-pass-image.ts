// The QR arrives as a data: URL, which the CSP allows for images (img-src)
// but not necessarily for fetch (connect-src), so load it as an <img>.
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the QR image."));
    img.src = src;
  });
}

type PassInfo = {
  qrUrl: string;
  code: string;
  childNames: string;
  collectedBy: string;
  validUntil: string;
  /** A lasting pass says so, and is not a one-time code */
  standing?: boolean;
};

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/\s*\S*$/, "") + "…";
    return kept;
  }
  return lines;
}

/** Draws a shareable "pickup pass" PNG: the QR plus everything the person
 * receiving it on WhatsApp needs to know, so it makes sense on its own. */
export async function buildPickupPassImage(info: PassInfo): Promise<File> {
  const W = 720;
  const H = 1040;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const font = (weight: number, size: number, family = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif") =>
    `${weight} ${size}px ${family}`;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#1d4ed8";
  ctx.fillRect(0, 0, W, 132);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = font(700, 44);
  ctx.fillText("VerifyGate", W / 2, 70);
  ctx.font = font(500, 22);
  ctx.fillStyle = "#dbeafe";
  ctx.fillText(info.standing ? "Regular pickup pass" : "School pickup pass", W / 2, 106);

  let y = 190;
  ctx.fillStyle = "#64748b";
  ctx.font = font(600, 20);
  ctx.fillText("PICKING UP", W / 2, y);
  y += 42;
  ctx.fillStyle = "#0f172a";
  ctx.font = font(700, 32);
  for (const line of wrapLines(ctx, info.childNames, W - 100, 2)) {
    ctx.fillText(line, W / 2, y);
    y += 40;
  }
  ctx.fillStyle = "#475569";
  ctx.font = font(500, 22);
  ctx.fillText(`Collected by ${info.collectedBy}`, W / 2, y + 4);

  const qr = await loadImage(info.qrUrl);
  const qrSize = 440;
  const qrY = y + 34;
  ctx.drawImage(qr, (W - qrSize) / 2, qrY, qrSize, qrSize);

  let cy = qrY + qrSize + 70;
  ctx.fillStyle = "#0f172a";
  ctx.font = font(700, info.standing ? 46 : 60, "ui-monospace, 'SF Mono', Menlo, Consolas, monospace");
  // The long standing code is shown in groups of four so it still fits and is easy to read out
  ctx.fillText(info.standing ? info.code.replace(/(.{4})/g, "$1 ").trim() : info.code.split("").join(" "), W / 2, cy);

  cy += 50;
  ctx.fillStyle = "#15803d";
  ctx.font = font(600, 22);
  ctx.fillText(info.validUntil, W / 2, cy);

  ctx.fillStyle = "#94a3b8";
  ctx.font = font(500, 19);
  ctx.fillText(info.standing ? "Show this at the school gate. The parent can cancel it at any time." : "Show this at the school gate. It can only be used once.", W / 2, H - 36);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not create the image."))), "image/png")
  );
  return new File([blob], `verifygate-pickup-${info.code}.png`, { type: "image/png" });
}
