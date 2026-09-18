import catalogue from './templates.json' with { type: 'json' };

export const TEMPLATES = catalogue.templates;
export const FONTS = catalogue.fonts;
export const LIMITS = catalogue.limits;

export function getTemplate(idOrIndex) {
  if (typeof idOrIndex === 'number') return TEMPLATES[idOrIndex] || TEMPLATES[0];
  return TEMPLATES.find((t) => t.id === idOrIndex) || TEMPLATES[0];
}

export function fontStack(key) {
  return FONTS[key] || FONTS.sans;
}
