export const THEME_PALETTES = ['clinic', 'emerald', 'slate', 'sunset'] as const;

export type ThemePalette = (typeof THEME_PALETTES)[number];

export const THEME_PALETTE_LABELS: Record<ThemePalette, string> = {
  clinic: 'Clinic Azul',
  emerald: 'Esmeralda',
  slate: 'Slate Profesional',
  sunset: 'Coral Suave',
};

export function isThemePalette(value: unknown): value is ThemePalette {
  return typeof value === 'string' && THEME_PALETTES.includes(value as ThemePalette);
}

