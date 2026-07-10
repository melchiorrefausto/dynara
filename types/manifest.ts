// Mirrors browser-extension/src/shared/manifest.ts field-for-field — this is
// what gets exported as dynara.json / Dynara.init({...}) for a developer's app.

export type ManifestPanel = {
  id: string;
  label: string;
  selector: string;
  side?: "left" | "right" | "top" | "bottom";
};

export type ManifestView = {
  id: string;
  label: string;
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

export type ContentBlock = {
  id: string;
  key: string;
  type: "text" | "image";
  selector: string;
  value: string;
  label?: string;
  updatedAt?: string;
};

export type ManifestConstraint = {
  id: string;
  label: string;
  description: string;
  severity: "info" | "warning" | "blocking";
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

export type IntegrationManifest = {
  id: string;
  slug: string;
  name: string;
  color: string;
  appId: string;
  version: string;
  panels: ManifestPanel[];
  surfaces: ManifestSurface[];
  views: ManifestView[];
  actions: ManifestAction[];
  designSystem: ManifestDesignSystem;
  constraints: ManifestConstraint[];
  profiles: UserInterfaceProfile[];
  contentBlocks: ContentBlock[];
  /** SHA-256 hex hash of the password gating "Edit" mode. Unset = anyone with the extension can edit. */
  editKeyHash?: string;
  createdAt: string;
  updatedAt: string;
};
