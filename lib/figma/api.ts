export type FigmaComponent = {
  key: string;
  file_key: string;
  node_id: string;
  name: string;
  description: string;
  containing_frame?: { name: string };
  containing_page?: { name: string };
};

export type FigmaVariable = {
  id: string;
  name: string;
  resolvedType: "COLOR" | "FLOAT" | "STRING" | "BOOLEAN";
  valuesByMode: Record<string, FigmaColor | number | string | boolean>;
  hiddenFromPublishing?: boolean;
};

export type FigmaVariableCollection = {
  id: string;
  name: string;
  modes: { modeId: string; name: string }[];
  defaultModeId: string;
  variableIds: string[];
};

type FigmaColor = { r: number; g: number; b: number; a: number };

type FigmaApiError = { status: number; err?: string; message?: string };

export type FigmaFileSyncData = {
  fileName: string;
  components: FigmaComponent[];
  variables: FigmaVariable[];
  collections: FigmaVariableCollection[];
};

function isFigmaColor(value: unknown): value is FigmaColor {
  return (
    typeof value === "object" &&
    value !== null &&
    "r" in value &&
    "g" in value &&
    "b" in value
  );
}

function toHex(channel: number) {
  return Math.round(channel * 255)
    .toString(16)
    .padStart(2, "0");
}

export function figmaColorToHex(color: FigmaColor) {
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

export function getResolvedColorValue(
  variable: FigmaVariable,
  collections: FigmaVariableCollection[]
): string | null {
  const collection = collections.find((c) => c.variableIds.includes(variable.id));
  if (!collection) return null;
  const value = variable.valuesByMode[collection.defaultModeId];
  if (!isFigmaColor(value)) return null;
  return figmaColorToHex(value);
}

export function parseFigmaFileKey(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9]{10,}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
  return match?.[1] ?? null;
}

async function figmaFetch<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`https://api.figma.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as FigmaApiError;
    throw new Error(
      err.err ?? err.message ?? `Figma API error ${response.status} on ${path}`
    );
  }

  return response.json() as Promise<T>;
}

type FigmaFileMetaResponse = { name: string; lastModified: string };
type FigmaComponentsResponse = { meta: { components: FigmaComponent[] } };
type FigmaVariablesResponse = {
  meta: {
    variables: Record<string, FigmaVariable>;
    variableCollections: Record<string, FigmaVariableCollection>;
  };
};

export async function syncFigmaFile(
  token: string,
  fileKey: string
): Promise<FigmaFileSyncData> {
  const [fileMeta, componentsMeta, variablesMeta] = await Promise.allSettled([
    figmaFetch<FigmaFileMetaResponse>(`/v1/files/${fileKey}?depth=1`, token),
    figmaFetch<FigmaComponentsResponse>(`/v1/files/${fileKey}/components`, token),
    figmaFetch<FigmaVariablesResponse>(`/v1/files/${fileKey}/variables/local`, token)
  ]);

  const fileName =
    fileMeta.status === "fulfilled" ? fileMeta.value.name : "Figma File";

  const components =
    componentsMeta.status === "fulfilled"
      ? componentsMeta.value.meta.components
      : [];

  const variables =
    variablesMeta.status === "fulfilled"
      ? Object.values(variablesMeta.value.meta.variables)
      : [];

  const collections =
    variablesMeta.status === "fulfilled"
      ? Object.values(variablesMeta.value.meta.variableCollections)
      : [];

  if (
    fileMeta.status === "rejected" &&
    componentsMeta.status === "rejected" &&
    variablesMeta.status === "rejected"
  ) {
    throw new Error(
      (fileMeta.reason as Error).message ?? "Could not reach Figma API."
    );
  }

  return { fileName, components, variables, collections };
}
