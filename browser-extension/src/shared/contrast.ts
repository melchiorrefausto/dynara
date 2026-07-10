import type { DynaraManifest, ManifestDesignToken, UserInterfaceProfile } from "./manifest";

export type ContrastLevel = "AA" | "AAA" | "fail";

export type ContrastResult = {
  id: string;
  label: string;
  foregroundToken: string;
  backgroundToken: string;
  foreground: string;
  background: string;
  ratio: number;
  level: ContrastLevel;
  passesAA: boolean;
  passesAAA: boolean;
};

const CONTRAST_PAIRS = [
  ["color-foreground", "color-background", "Page text"],
  ["color-card-foreground", "color-card", "Card text"],
  ["color-primary-foreground", "color-primary", "Primary text"],
  ["color-secondary-foreground", "color-secondary", "Secondary text"],
  ["color-muted-foreground", "color-muted", "Muted text"],
  ["color-accent-foreground", "color-accent", "Accent text"]
] as const;

export function auditManifestContrast(
  manifest: DynaraManifest,
  overrides: Record<string, string> = {}
): ContrastResult[] {
  return auditContrastPairs(tokenValueMap(manifest.designSystem.tokens), overrides);
}

export function auditProfileContrast(manifest: DynaraManifest, profile?: UserInterfaceProfile): ContrastResult[] {
  return auditManifestContrast(manifest, profile?.tokenOverrides ?? {});
}

export function auditContrastPairs(
  baseTokens: Record<string, string>,
  overrides: Record<string, string> = {}
): ContrastResult[] {
  const tokens = { ...baseTokens, ...overrides };

  return CONTRAST_PAIRS.flatMap(([foregroundToken, backgroundToken, label]) => {
    const foreground = tokens[foregroundToken];
    const background = tokens[backgroundToken];
    if (!foreground || !background) return [];

    const ratio = contrastRatio(foreground, background);
    if (ratio === null) return [];

    const rounded = Math.round(ratio * 100) / 100;
    return [{
      id: `${foregroundToken}-on-${backgroundToken}`,
      label,
      foregroundToken,
      backgroundToken,
      foreground,
      background,
      ratio: rounded,
      level: rounded >= 7 ? "AAA" : rounded >= 4.5 ? "AA" : "fail",
      passesAA: rounded >= 4.5,
      passesAAA: rounded >= 7
    }];
  });
}

export function failingContrast(results: ContrastResult[]) {
  return results.filter((result) => !result.passesAA);
}

export function contrastSummary(results: ContrastResult[]) {
  if (results.length === 0) return "No contrast pairs";
  const failing = failingContrast(results).length;
  if (failing === 0) return `AA pass (${results.length}/${results.length})`;
  return `${failing} contrast issue${failing === 1 ? "" : "s"}`;
}

function tokenValueMap(tokens: ManifestDesignToken[]) {
  return Object.fromEntries(tokens.map((token) => [token.id, token.value]));
}

function contrastRatio(foreground: string, background: string) {
  const fg = parseColor(foreground);
  const bg = parseColor(background);
  if (!fg || !bg) return null;

  const fgLum = relativeLuminance(fg);
  const bgLum = relativeLuminance(bg);
  const light = Math.max(fgLum, bgLum);
  const dark = Math.min(fgLum, bgLum);
  return (light + 0.05) / (dark + 0.05);
}

function parseColor(value: string): [number, number, number] | null {
  const trimmed = value.trim();
  if (trimmed.startsWith("#")) return parseHex(trimmed);
  return parseHslTriplet(trimmed);
}

function parseHex(value: string): [number, number, number] | null {
  const raw = value.slice(1);
  const hex = raw.length === 3
    ? raw.split("").map((char) => char + char).join("")
    : raw;

  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16)
  ];
}

function parseHslTriplet(value: string): [number, number, number] | null {
  const match = value.match(/^(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!match) return null;

  const h = Number(match[1]);
  const s = Number(match[2]) / 100;
  const l = Number(match[3]) / 100;
  if (!Number.isFinite(h) || !Number.isFinite(s) || !Number.isFinite(l)) return null;

  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const hue = (((h % 360) + 360) % 360) / 60;
  const x = chroma * (1 - Math.abs((hue % 2) - 1));
  const m = l - chroma / 2;

  let rgb: [number, number, number];
  if (hue < 1) rgb = [chroma, x, 0];
  else if (hue < 2) rgb = [x, chroma, 0];
  else if (hue < 3) rgb = [0, chroma, x];
  else if (hue < 4) rgb = [0, x, chroma];
  else if (hue < 5) rgb = [x, 0, chroma];
  else rgb = [chroma, 0, x];

  return rgb.map((channel) => Math.round((channel + m) * 255)) as [number, number, number];
}

function relativeLuminance([r, g, b]: [number, number, number]) {
  const [sr, sg, sb] = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * sr + 0.7152 * sg + 0.0722 * sb;
}
