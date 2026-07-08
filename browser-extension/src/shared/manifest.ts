// The Dynara manifest is what a developer publishes (via the SDK script tag,
// a /.well-known/dynara.json file, or plain data-dynara-panel attributes) to
// describe which parts of their UI can be customized.

export type ManifestPanel = {
  id: string;
  label: string;
  selector: string;
  side?: "left" | "right" | "top" | "bottom";
};

export type ManifestView = {
  id: string;
  label: string;
  /** Panel ids to keep visible; every other declared panel is hidden. */
  panels: string[];
};

export type ManifestAction = {
  id: string;
  label: string;
};

export type DynaraManifest = {
  name: string;
  color: string;
  panels: ManifestPanel[];
  views: ManifestView[];
  actions: ManifestAction[];
  /** How the manifest was found — surfaced in the UI so devs can tell what's wired up. */
  source: "sdk" | "well-known" | "auto-discovery" | "none";
};

export const DEFAULT_MANIFEST: DynaraManifest = {
  name: "Web app",
  color: "#7c3aed",
  panels: [],
  views: [],
  actions: [],
  source: "none",
};

export function normalizeManifest(raw: Partial<DynaraManifest> | null | undefined, source: DynaraManifest["source"]): DynaraManifest {
  return {
    name: raw?.name || DEFAULT_MANIFEST.name,
    color: raw?.color || DEFAULT_MANIFEST.color,
    panels: Array.isArray(raw?.panels) ? raw!.panels! : [],
    views: Array.isArray(raw?.views) ? raw!.views! : [],
    actions: Array.isArray(raw?.actions) ? raw!.actions! : [],
    source,
  };
}
