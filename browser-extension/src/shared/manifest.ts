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
  description?: string;
  kind?: "command" | "navigation" | "mutation" | "export";
  requiresConfirmation?: boolean;
};

export type ManifestSurface = {
  id: string;
  label: string;
  type: "panel" | "sidebar" | "toolbar" | "canvas" | "inspector" | "modal" | "navigation" | "content";
  selector?: string;
  nativeHandle?: string;
  side?: "left" | "right" | "top" | "bottom";
  required?: boolean;
  hideable: boolean;
  movable: boolean;
  resizable: boolean;
  allowedPositions?: Array<"left" | "right" | "top" | "bottom" | "center">;
  description?: string;
};

export type UserInterfaceProfile = {
  id: string;
  label: string;
  description?: string;
  density: "compact" | "comfortable" | "spacious";
  accessibility: {
    contrast: "normal" | "high";
    motion: "normal" | "reduced";
    fontScale: number;
  };
  visibleSurfaces: string[];
  pinnedActions: string[];
  tokenOverrides?: Record<string, string>;
};

export type ManifestDesignToken = {
  id: string;
  name: string;
  category: "color" | "typography" | "spacing" | "radius" | "shadow" | "motion";
  value: string;
  mutable: boolean;
};

export type ManifestDesignSystem = {
  source?: "figma" | "code" | "api" | "manual";
  version?: string;
  tokens: ManifestDesignToken[];
  componentRefs: Array<{
    id: string;
    name: string;
    sourceId?: string;
    description?: string;
  }>;
};

export type DynaraManifest = {
  appId?: string;
  name: string;
  version?: string;
  color: string;
  panels: ManifestPanel[];
  surfaces: ManifestSurface[];
  views: ManifestView[];
  actions: ManifestAction[];
  designSystem: ManifestDesignSystem;
  profiles: UserInterfaceProfile[];
  /** How the manifest was found — surfaced in the UI so devs can tell what's wired up. */
  source: "sdk" | "well-known" | "auto-discovery" | "none";
};

export type InterfacePlan = {
  title: string;
  summary: string;
  profileId?: string;
  viewId?: string;
  visibleSurfaces?: string[];
  tokenOverrides?: Record<string, string>;
  actionIds?: string[];
  save?: boolean;
};

export const DEFAULT_MANIFEST: DynaraManifest = {
  name: "Web app",
  color: "#7c3aed",
  panels: [],
  surfaces: [],
  views: [],
  actions: [],
  designSystem: {
    source: "manual",
    tokens: [],
    componentRefs: []
  },
  profiles: [],
  source: "none",
};

export function normalizeManifest(raw: Partial<DynaraManifest> | null | undefined, source: DynaraManifest["source"]): DynaraManifest {
  const panels = Array.isArray(raw?.panels) ? raw!.panels! : [];
  const surfaces = Array.isArray(raw?.surfaces) && raw!.surfaces!.length > 0
    ? raw!.surfaces!
    : panels.map((panel) => ({
        id: panel.id,
        label: panel.label,
        type: "panel" as const,
        selector: panel.selector,
        side: panel.side,
        required: false,
        hideable: true,
        movable: false,
        resizable: false
      }));

  return {
    appId: raw?.appId,
    name: raw?.name || DEFAULT_MANIFEST.name,
    version: raw?.version,
    color: raw?.color || DEFAULT_MANIFEST.color,
    panels,
    surfaces,
    views: Array.isArray(raw?.views) ? raw!.views! : [],
    actions: Array.isArray(raw?.actions) ? raw!.actions! : [],
    designSystem: {
      ...(raw?.designSystem ?? {}),
      tokens: Array.isArray(raw?.designSystem?.tokens) ? raw!.designSystem!.tokens : [],
      componentRefs: Array.isArray(raw?.designSystem?.componentRefs) ? raw!.designSystem!.componentRefs : []
    },
    profiles: Array.isArray(raw?.profiles) ? raw!.profiles! : [],
    source,
  };
}
