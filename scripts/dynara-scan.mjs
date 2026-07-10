#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { glob } from "node:fs/promises";

const USAGE = "Usage: dynara scan <app-folder> --out <public/.well-known/dynara.json>";
const SOURCE_PATTERN = "**/*.{html,js,jsx,ts,tsx,vue,svelte}";
const IGNORED_PARTS = new Set([".git", ".next", "dist", "build", "coverage", "node_modules"]);

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "app";
}

function titleCase(value) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function parseArgs(argv) {
  const [command, appDir, ...rest] = argv;
  const outIndex = rest.indexOf("--out");

  if (command !== "scan" || !appDir || outIndex === -1 || !rest[outIndex + 1]) {
    throw new Error(USAGE);
  }

  return {
    appDir: path.resolve(process.cwd(), appDir),
    outFile: path.resolve(process.cwd(), rest[outIndex + 1]),
  };
}

async function readPackageName(appDir) {
  const pkgPath = path.join(appDir, "package.json");
  if (!existsSync(pkgPath)) return null;

  try {
    const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
    return pkg.description || pkg.name || null;
  } catch {
    return null;
  }
}

async function readHtmlTitle(appDir) {
  for (const file of ["index.html", "public/index.html"]) {
    const filePath = path.join(appDir, file);
    if (!existsSync(filePath)) continue;

    const html = await readFile(filePath, "utf8");
    const title = html.match(/<title>(.*?)<\/title>/is)?.[1]?.trim();
    if (title) return title.replace(/\s*[|—-]\s*.*$/, "");
  }

  return null;
}

async function readSources(appDir) {
  const files = [];
  for await (const entry of glob(SOURCE_PATTERN, { cwd: appDir })) {
    const parts = entry.split(path.sep);
    if (parts.some((part) => IGNORED_PARTS.has(part))) continue;
    files.push(path.join(appDir, entry));
  }

  const chunks = await Promise.all(
    files.map(async (file) => {
      try {
        return await readFile(file, "utf8");
      } catch {
        return "";
      }
    })
  );

  return chunks.join("\n");
}

function panelsFromDynaraAttributes(source) {
  const matches = [...source.matchAll(/data-dynara-panel\s*=\s*["'{`]([^"'}\s`]+)["'}`]/g)];
  const ids = [...new Set(matches.map((match) => match[1]))];

  return ids.map((id) => ({
    id,
    label: titleCase(id),
    selector: `[data-dynara-panel="${id}"]`,
  }));
}

function fallbackPanels(source) {
  const candidates = [
    ["navigation", "Navigation", "header", /<header[\s>]/],
    ["main-content", "Main Content", "main", /<main[\s>]/],
    ["footer", "Footer", "footer", /<footer[\s>]/],
    ["app-root", "App Root", "#root", /id=["']root["']/],
  ];

  return candidates
    .filter(([, , , pattern]) => pattern.test(source))
    .map(([id, label, selector]) => ({ id, label, selector }));
}

function buildSurfaces(panels) {
  return panels.map((panel, index) => ({
    id: panel.id,
    label: panel.label,
    type: panel.id === "navigation" ? "navigation" : panel.id === "footer" ? "content" : "panel",
    selector: panel.selector,
    side: index === 0 ? "top" : panel.id === "footer" ? "bottom" : undefined,
    required: panel.id === "main-content",
    hideable: panel.id !== "main-content",
    movable: false,
    resizable: false,
  }));
}

async function scan({ appDir, outFile }) {
  if (!existsSync(appDir)) {
    throw new Error(`App folder does not exist: ${appDir}`);
  }

  const source = await readSources(appDir);
  const appName = (await readHtmlTitle(appDir)) || (await readPackageName(appDir)) || path.basename(appDir);
  const appId = slugify(appName);
  const panels = panelsFromDynaraAttributes(source);
  const detectedPanels = panels.length > 0 ? panels : fallbackPanels(source);

  const manifest = {
    name: appName,
    color: "#7c3aed",
    appId,
    version: "1.0.0",
    panels: detectedPanels,
    surfaces: buildSurfaces(detectedPanels),
    views: detectedPanels.length
      ? [
          {
            id: "default",
            label: "Default",
            panels: detectedPanels.map((panel) => panel.id),
          },
        ]
      : [],
    actions: [],
    designSystem: {
      source: "code",
      tokens: [],
      componentRefs: [],
    },
    constraints: [],
    profiles: [],
  };

  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`Dynara manifest written to ${path.relative(process.cwd(), outFile)}`);
  console.log(`Detected ${detectedPanels.length} panel${detectedPanels.length === 1 ? "" : "s"} from ${path.relative(process.cwd(), appDir)}`);
}

try {
  await scan(parseArgs(process.argv.slice(2)));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
