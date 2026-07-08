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
};

export type IntegrationManifest = {
  id: string;
  slug: string;
  name: string;
  color: string;
  panels: ManifestPanel[];
  views: ManifestView[];
  actions: ManifestAction[];
  createdAt: string;
  updatedAt: string;
};
