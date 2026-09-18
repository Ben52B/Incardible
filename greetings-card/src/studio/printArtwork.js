// Renders the inside-left page of the folded card (the printed greeting) as an
// A4-landscape PNG at 300 dpi (3508 × 2480), the size the admin print flow
// expects. The left half is the message page; the right half stays blank for
// the inside-right artwork.
const W = 3508, H = 2480;
const PAGE_W = W / 2;

function wrap(ctx, text, maxWidth) {
  const out = [];
  for (const para of String(text || '').split(/\r?\n/)) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) { out.push(''); continue; }
    let line = words[0];
    for (let i = 1; i < words.length; i++) {
      const t = `${line} ${words[i]}`;
      if (ctx.measureText(t).width > maxWidth) { out.push(line); line = words[i]; } else line = t;
    }
    out.push(line);
  }
  return out;
}

export async function renderPrintArtwork({ heading, paragraph1, paragraph2, fontFamily, color = '#2b2b2b' }) {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  const margin = 260; // ~22 mm
  const maxWidth = PAGE_W - margin * 2;
  const headingPx = 150, bodyPx = 78, lh = 1.35;

  ctx.font = `700 ${headingPx}px ${fontFamily}`;
  const hLines = heading ? wrap(ctx, heading, maxWidth) : [];
  ctx.font = `400 ${bodyPx}px ${fontFamily}`;
  const p1 = paragraph1 ? wrap(ctx, paragraph1, maxWidth) : [];
  const p2 = paragraph2 ? wrap(ctx, paragraph2, maxWidth) : [];
  const total = hLines.length * headingPx * lh + (hLines.length ? 90 : 0) + p1.length * bodyPx * lh + (p2.length ? 120 : 0) + p2.length * bodyPx * lh;
  let y = Math.max(margin, (H - total) / 2);

  ctx.textAlign = 'center';
  const cx = PAGE_W / 2;
  ctx.font = `700 ${headingPx}px ${fontFamily}`;
  for (const l of hLines) { ctx.fillText(l, cx, y); y += headingPx * lh; }
  if (hLines.length) y += 90;
  ctx.font = `400 ${bodyPx}px ${fontFamily}`;
  for (const l of p1) { ctx.fillText(l, cx, y); y += bodyPx * lh; }
  if (p2.length) y += 120;
  ctx.font = `italic 400 ${bodyPx}px ${fontFamily}`;
  for (const l of p2) { ctx.fillText(l, cx, y); y += bodyPx * lh; }

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
