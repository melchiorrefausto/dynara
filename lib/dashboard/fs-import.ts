import type { IntegrationManifest } from "@/types/manifest";

const SKIP_DIRS = new Set(["node_modules", "dist", "build", ".git", ".next", "out", "coverage", ".vercel", ".netlify"]);
const SOURCE_EXTENSIONS = [".tsx", ".jsx", ".ts", ".js", ".vue", ".svelte"];
const MAX_SOURCE_FILES = 400;

export type DiscoveredFile = { path: string; handle: FileSystemFileHandle };

export function supportsFileSystemAccess(): boolean {
  return typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";
}

export async function pickProjectDirectory(): Promise<FileSystemDirectoryHandle> {
  if (!window.showDirectoryPicker) {
    throw new Error("File System Access API is not supported in this browser. Use Chrome or Edge.");
  }
  return window.showDirectoryPicker({ mode: "readwrite" });
}

export async function collectSourceFiles(root: FileSystemDirectoryHandle): Promise<DiscoveredFile[]> {
  const results: DiscoveredFile[] = [];

  async function walk(dir: FileSystemDirectoryHandle, path: string) {
    if (results.length >= MAX_SOURCE_FILES) return;

    for await (const [name, handle] of dir.entries()) {
      if (results.length >= MAX_SOURCE_FILES) return;

      const entryPath = path ? `${path}/${name}` : name;

      if (handle.kind === "directory") {
        if (SKIP_DIRS.has(name) || name.startsWith(".")) continue;
        await walk(handle, entryPath);
      } else if (SOURCE_EXTENSIONS.some((ext) => name.endsWith(ext))) {
        results.push({ path: entryPath, handle });
      }
    }
  }

  await walk(root, "");

  // Surface likely "dashboard/layout" files first — they're the most useful to analyze.
  return results.sort((a, b) => {
    const score = (path: string) => (/dashboard|layout|page/i.test(path) ? 0 : 1);
    return score(a.path) - score(b.path) || a.path.localeCompare(b.path);
  });
}

export async function findIndexHtml(root: FileSystemDirectoryHandle): Promise<FileSystemFileHandle | null> {
  for await (const [name, handle] of root.entries()) {
    if (handle.kind === "file" && name === "index.html") return handle;
  }

  for await (const [name, handle] of root.entries()) {
    if (handle.kind === "directory" && (name === "public" || name === "static") ) {
      for await (const [childName, childHandle] of handle.entries()) {
        if (childHandle.kind === "file" && childName === "index.html") return childHandle as FileSystemFileHandle;
      }
    }
  }

  return null;
}

export type ApplyResult = {
  applied: { id: string; componentName: string }[];
  skipped: { id: string; componentName: string; reason: string }[];
};

// Wraps each selected self-closing JSX component tag, e.g. `<Stats />`, with a
// `<div data-dynara-panel="...">...</div>`. Non-self-closing usages are skipped
// (regex can't safely balance arbitrary nested JSX) and reported for manual edit.
export function applyPanelWrappers(
  sourceText: string,
  selections: { id: string; componentName?: string }[]
): { text: string; result: ApplyResult } {
  let text = sourceText;
  const result: ApplyResult = { applied: [], skipped: [] };

  for (const selection of selections) {
    const componentName = selection.componentName;
    if (!componentName) {
      result.skipped.push({ id: selection.id, componentName: "(unknown)", reason: "no source component name" });
      continue;
    }

    if (text.includes(`data-dynara-panel="${selection.id}"`) || text.includes(`data-dynara-panel='${selection.id}'`)) {
      result.applied.push({ id: selection.id, componentName });
      continue;
    }

    const selfClosing = new RegExp(`<${componentName}(\\s[^>]*?)?/>`);
    const match = text.match(selfClosing);

    if (!match) {
      result.skipped.push({
        id: selection.id,
        componentName,
        reason: `couldn't find a self-closing <${componentName} /> tag to wrap automatically`
      });
      continue;
    }

    text = text.replace(selfClosing, `<div data-dynara-panel="${selection.id}">${match[0]}</div>`);
    result.applied.push({ id: selection.id, componentName });
  }

  return { text, result };
}

const SCRIPT_START = "<!-- dynara-integration:start -->";
const SCRIPT_END = "<!-- dynara-integration:end -->";

export function upsertScriptBlock(htmlText: string, manifest: IntegrationManifest, sdkBaseUrl: string): string {
  const init = JSON.stringify(
    { name: manifest.name, color: manifest.color, panels: manifest.panels, views: manifest.views, actions: manifest.actions },
    null,
    2
  );

  const block = [
    SCRIPT_START,
    `<script src="${sdkBaseUrl}/sdk/v1.js"></script>`,
    `<script>`,
    `  Dynara.init(${init.replace(/\n/g, "\n  ")});`,
    `</script>`,
    SCRIPT_END
  ].join("\n");

  const existingPattern = new RegExp(`${SCRIPT_START}[\\s\\S]*?${SCRIPT_END}`);
  if (existingPattern.test(htmlText)) {
    return htmlText.replace(existingPattern, block);
  }

  if (htmlText.includes("</body>")) {
    return htmlText.replace("</body>", `${block}\n</body>`);
  }

  return `${htmlText}\n${block}\n`;
}
