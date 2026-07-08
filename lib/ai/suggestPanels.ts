export type SourceFile = { name: string; content: string };

export type SuggestedPanel = {
  id: string;
  label: string;
  componentName?: string;
};

const MAX_FILE_CHARS = 4000;
const MAX_FILES = 6;

const systemPrompt = `You analyze frontend source code and identify distinct UI sections a developer might want to make toggleable from a browser extension (Dynara).

Return ONLY valid JSON, no markdown, no explanation, matching exactly:
{"panels":[{"id":"kebab-case-id","label":"Human readable label","componentName":"OriginalComponentNameIfAny"}]}

Rules:
- Look for top-level rendered sections in layout/dashboard components — e.g. <StatsOverview />, <GeneratorPanel />, <section>, named blocks.
- Ignore generic wrapper divs, providers, and layout chrome (nav/header) unless it's clearly a distinct content section the user asked about.
- Prefer components with clear, distinct responsibilities over deeply nested implementation details.
- Return at most 10 panels, ordered as they appear in the source.
- "id" must be lowercase kebab-case, derived from the component/section name.`;

function buildUserMessage(files: SourceFile[]): string {
  return files
    .slice(0, MAX_FILES)
    .map((file) => `--- ${file.name} ---\n${file.content.slice(0, MAX_FILE_CHARS)}`)
    .join("\n\n");
}

export async function suggestPanelsFromFiles(files: SourceFile[]): Promise<SuggestedPanel[]> {
  const trimmedFiles = files.filter((file) => file.content.trim().length > 0);
  if (trimmedFiles.length === 0) return [];

  const userMessage = buildUserMessage(trimmedFiles);
  const fallback = heuristicSuggestPanels(trimmedFiles);

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
          const parsed = JSON.parse(json) as { panels?: SuggestedPanel[] };
          if (Array.isArray(parsed.panels) && parsed.panels.length > 0) return parsed.panels;
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
          const parsed = JSON.parse(content) as { panels?: SuggestedPanel[] };
          if (Array.isArray(parsed.panels) && parsed.panels.length > 0) return parsed.panels;
        }
      }
    } catch {
      return fallback;
    }
  }

  return fallback;
}

// No AI key configured (or the call failed) — fall back to a regex scan for
// capitalized JSX component tags, which is a decent proxy for "distinct section".
function heuristicSuggestPanels(files: SourceFile[]): SuggestedPanel[] {
  const seen = new Map<string, SuggestedPanel>();

  for (const file of files) {
    const matches = file.content.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g);
    for (const match of matches) {
      const componentName = match[1];
      if (["Fragment", "Suspense", "Provider"].some((skip) => componentName.includes(skip))) continue;
      const id = toKebabCase(componentName);
      if (!seen.has(id)) {
        seen.set(id, { id, label: toLabel(componentName), componentName });
      }
      if (seen.size >= 10) break;
    }
  }

  return [...seen.values()];
}

function toKebabCase(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function toLabel(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}
