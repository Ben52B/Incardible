import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import QRCode from 'react-qr-code';

const AR_BASE = process.env.NEXT_PUBLIC_AR_EXPERIENCE_LINK;

/** The exact URL the AR viewer expects: <base>?templateId=<CardCustomization._id> */
export const buildArUrl = (templateId) => {
  if (!templateId || !AR_BASE) return null;
  try {
    const url = new URL(AR_BASE);
    url.searchParams.set('templateId', String(templateId));
    return url.toString();
  } catch (err) {
    const base = AR_BASE.endsWith('/') ? AR_BASE.slice(0, -1) : AR_BASE;
    return `${base}/?templateId=${templateId}`;
  }
};

/** QR as standalone SVG markup, generated locally (no third-party service). */
export const qrSvgMarkup = (value, size = 600) => {
  let svg = renderToStaticMarkup(<QRCode value={value} size={size} level="M" />);
  if (!/xmlns=/.test(svg)) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  return svg;
};

/** QR as a PNG data URL with a white quiet zone, for print and download. */
export const qrPngDataUrl = (value, size = 600, margin = Math.round(size * 0.06)) =>
  new Promise((resolve, reject) => {
    const svg = qrSvgMarkup(value, size);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size + margin * 2;
      canvas.height = size + margin * 2;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, margin, margin, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });

export const qrPngBlob = async (value, size = 600) => {
  const dataUrl = await qrPngDataUrl(value, size);
  const res = await fetch(dataUrl);
  return res.blob();
};
