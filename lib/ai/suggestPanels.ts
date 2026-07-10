export type SourceFile = { name: string; content: string };

export type SuggestedPanel = {
  id: string;
  label: string;
  componentName?: string;
  selector?: string;
};

export type SuggestedAction = {
  id: string;
  label: string;
  description?: string;
  kind?: "command" | "navigation" | "mutation" | "export";
};

export type SuggestedIntegration = {
  panels: SuggestedPanel[];
  actions: SuggestedAction[];
};

const MAX_FILE_CHARS = 4000;
const MAX_FILES = 6;

const systemPrompt = `You analyze frontend source code and identify distinct UI sections and safe host actions a developer might want to expose to a browser extension (Dynara).

Return ONLY valid JSON, no markdown, no explanation, matching exactly:
{"panels":[{"id":"kebab-case-id","label":"Human readable label","componentName":"OriginalComponentNameIfAny","selector":"#existing-dom-id-if-any"}],"actions":[{"id":"kebab-case-id","label":"Human readable label","kind":"command"}]}

Rules:
- Look for top-level rendered sections in layout/dashboard components — e.g. <StatsOverview />, <GeneratorPanel />, <section>, named blocks.
- For static HTML, use meaningful DOM ids and semantic elements as panels, e.g. <div id="viewer"> or <main>.
- Ignore generic wrapper divs, providers, and layout chrome (nav/header) unless it's clearly a distinct content section the user asked about.
- Prefer components with clear, distinct responsibilities over deeply nested implementation details.
- Actions must be user-triggered capabilities already visible in the code: buttons, menus, click handlers, export/save/reset/open/generate functions.
- Return at most 10 panels, ordered as they appear in the source.
- Return at most 8 actions, ordered by importance.
- "id" must be lowercase kebab-case, derived from the component/section name.`;

function buildUserMessage(files: SourceFile[]): string {
  return files
    .slice(0, MAX_FILES)
    .map((file) => `--- ${file.name} ---\n${file.content.slice(0, MAX_FILE_CHARS)}`)
    .join("\n\n");
}

export async function suggestPanelsFromFiles(files: SourceFile[]): Promise<SuggestedPanel[]> {
  const result = await suggestIntegrationFromFiles(files);
  return result.panels;
}

export async function suggestIntegrationFromFiles(files: SourceFile[]): Promise<SuggestedIntegration> {
  const trimmedFiles = files.filter((file) => file.content.trim().length > 0);
  if (trimmedFiles.length === 0) return { panels: [], actions: [] };

  const userMessage = buildUserMessage(trimmedFiles);
  const fallback = heuristicSuggestIntegration(trimmedFiles);

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          temperature: 0.1,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }]
        })
      });

      if (response.ok) {
        const payload = await response.json();
        const text = payload.content?.[0]?.text as string | undefined;
        const json = text?.match(/\{[\s\S]*\}/)?.[0];
        if (json) {
          const parsed = normalizeSuggestionPayload(JSON.parse(json));
          const merged = mergeWithFallback(parsed, fallback);
          if (merged.panels.length > 0 || merged.actions.length > 0) return merged;
        }
      }
    } catch {
      return fallback;
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          response_format: { type: "json_object" },
          temperature: 0.1,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ]
        })
      });

      if (response.ok) {
        const payload = await response.json();
        const content = payload.choices?.[0]?.message?.content as string | undefined;
        if (content) {
          const parsed = normalizeSuggestionPayload(JSON.parse(content));
          const merged = mergeWithFallback(parsed, fallback);
          if (merged.panels.length > 0 || merged.actions.length > 0) return merged;
        }
      }
    } catch {
      return fallback;
    }
  }

  return fallback;
}

// No AI key configured (or the call failed) — fall back to regex scans for
// JSX components, static HTML landmarks, and obvious button/click actions.
function heuristicSuggestIntegration(files: SourceFile[]): SuggestedIntegration {
  const panels = new Map<string, SuggestedPanel>();
  const actions = new Map<string, SuggestedAction>();

  for (const file of files) {
    addJsxPanels(file.content, panels);
    addHtmlPanels(file.content, panels);
    addActionSuggestions(file.content, actions);

    if (hasSceneSurface(file)) {
      upsertAction(actions, {
        id: "reset-view",
        label: "Reset View",
        description: "Reset the interactive scene or canvas to its default view.",
        kind: "command"
      });
    }
  }

  return {
    panels: [...panels.values()].slice(0, 10),
    actions: [...actions.values()].slice(0, 8)
  };
}

function addJsxPanels(content: string, panels: Map<string, SuggestedPanel>) {
  const matches = content.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g);
  for (const match of matches) {
    const componentName = match[1];
    if (["Fragment", "Suspense", "Provider"].some((skip) => componentName.includes(skip))) continue;
    const id = toKebabCase(componentName);
    if (!panels.has(id)) {
      panels.set(id, { id, label: toLabel(componentName), componentName });
    }
    if (panels.size >= 10) break;
  }
}

function addHtmlPanels(content: string, panels: Map<string, SuggestedPanel>) {
  const elementMatches = content.matchAll(/<(main|section|aside|nav|header|footer|canvas|div)\b([^>]*)>/gi);
  for (const match of elementMatches) {
    const tagName = match[1].toLowerCase();
    const attrs = match[2] ?? "";
    const id = readAttribute(attrs, "id");
    const dynaraId = readAttribute(attrs, "data-dynara-panel");
    const ariaLabel = readAttribute(attrs, "aria-label");
    const title = readAttribute(attrs, "title");
    const dataName = readAttribute(attrs, "data-name");
    const className = readAttribute(attrs, "class");
    const sourceName = dynaraId || meaningfulDomId(id) || ariaLabel || title || dataName || semanticPanelName(tagName, className);
    if (!sourceName) continue;

    const panelId = slugLike(sourceName);
    if (!panelId || panels.has(panelId)) continue;
    panels.set(panelId, {
      id: panelId,
      label: toLabel(sourceName),
      selector: id ? `#${cssEscape(id)}` : tagName
    });
    if (panels.size >= 10) break;
  }
}

function addActionSuggestions(content: string, actions: Map<string, SuggestedAction>) {
  const buttonMatches = content.matchAll(/<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/gi);
  for (const match of buttonMatches) {
    const attrs = match[2] ?? "";
    const body = stripTags(match[3] ?? "");
    const label = readAttribute(attrs, "aria-label") || readAttribute(attrs, "title") || body;
    if (!label || label.length > 48) continue;
    upsertAction(actions, { id: slugLike(label), label: toLabel(label), kind: actionKind(label) });
  }

  const handlerMatches = content.matchAll(/\b(?:function|const|let|var)\s+(handle[A-Z][A-Za-z0-9]*|on[A-Z][A-Za-z0-9]*|(?:save|export|reset|open|generate|create|delete|share)[A-Z]?[A-Za-z0-9]*)\b/g);
  for (const match of handlerMatches) {
    const raw = match[1].replace(/^handle/, "").replace(/^on/, "");
    if (!raw) continue;
    const label = toLabel(raw);
    upsertAction(actions, { id: slugLike(raw), label, kind: actionKind(label) });
  }
}

function normalizeSuggestionPayload(value: unknown): SuggestedIntegration {
  const payload = value as { panels?: SuggestedPanel[]; actions?: SuggestedAction[] };
  return {
    panels: Array.isArray(payload.panels)
      ? payload.panels
          .filter((panel) => panel?.id && panel?.label)
          .map((panel) => ({ ...panel, id: slugLike(panel.id) }))
          .slice(0, 10)
      : [],
    actions: Array.isArray(payload.actions)
      ? payload.actions
          .filter((action) => action?.id && action?.label)
          .map((action) => ({ ...action, id: slugLike(action.id), kind: action.kind ?? actionKind(action.label) }))
          .slice(0, 8)
      : []
  };
}

function mergeWithFallback(primary: SuggestedIntegration, fallback: SuggestedIntegration): SuggestedIntegration {
  return {
    panels: primary.panels.length > 0 ? primary.panels : fallback.panels,
    actions: primary.actions.length > 0 ? primary.actions : fallback.actions
  };
}

function upsertAction(actions: Map<string, SuggestedAction>, action: SuggestedAction) {
  if (!action.id || actions.has(action.id)) return;
  actions.set(action.id, action);
}

function hasSceneSurface(file: SourceFile) {
  const text = `${file.name}\n${file.content}`.toLowerCase();
  return text.includes("canvas") || text.includes(".glb") || text.includes("three") || text.includes("gizmo-root");
}

function semanticPanelName(tagName: string, className: string | null) {
  if (tagName === "canvas") return "canvas";
  if (tagName !== "div") return tagName;
  if (!className) return null;
  const meaningful = className.split(/\s+/).find((item) => /panel|view|canvas|scene|workspace|dashboard|main|content/i.test(item));
  return meaningful ?? null;
}

function meaningfulDomId(id: string | null) {
  if (!id) return null;
  if (["root", "app", "__next", "main"].includes(id.toLowerCase())) return null;
  return id;
}

function readAttribute(attrs: string, name: string) {
  const match = attrs.match(new RegExp(`\\b${name}=(["'])(.*?)\\1`, "i"));
  return match?.[2]?.trim() || null;
}

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function actionKind(label: string): SuggestedAction["kind"] {
  const normalized = label.toLowerCase();
  if (/export|download/.test(normalized)) return "export";
  if (/open|go|view|navigate/.test(normalized)) return "navigation";
  if (/delete|create|save|update|apply|generate/.test(normalized)) return "mutation";
  return "command";
}

function cssEscape(value: string) {
  return value.replace(/["'\\]/g, "\\$&");
}

function slugLike(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toKebabCase(name: string): string {
  return slugLike(name);
}

function toLabel(name: string): string {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
