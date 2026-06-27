import type { AdapterPrimitive, WorkspaceSchema } from "@/types/workspace";

const baseSystemPrompt = `You generate Dynara workspace schemas. Return ONLY valid JSON matching this shape exactly — no markdown, no explanation:
{
  "id": "string",
  "name": "string",
  "mode": "design_system | developer_handoff | accessibility_review | client_feedback | component_audit | mobile_app | custom",
  "description": "string",
  "source": "generated",
  "actions": [{"id":"string","label":"string"}],
  "layout": []
}

Supported block types for layout:
- metric_card: { type, title, value, trend?, tone?: "purple"|"blue"|"green"|"amber"|"red" }
- component_list: { type, title, items: [{id,title,subtitle?,status?}], actionLabel? }
- issue_list: { type, title, items: [{id,title,subtitle?,severity?:"low"|"medium"|"high"}] }
- list: { type, title, items: [{id,title,subtitle?,value?}] }
- token_table: { type, title, items: [{id,name,value,category:"Color"|"Typography"|"Spacing"|"Radius"|"Effect"}] }
- suggestions: { type, title, items: [{id,title,description,actionLabel,impact?}] }
- activity_feed: { type, title, items: [{id,actor,event,time}] }
- quick_actions: { type, title, actions: [{id,label}] }
- dev_handoff: { type, title, items: [{id,title,count,status:"ready"|"review"|"blocked"}] }
- documentation: { type, title, items: [{id,title,subtitle?,status?}] }

Rules:
- Use real names and IDs from the provided primitives when available
- Generate metric_card blocks that reflect real counts from the primitives
- Choose mode based on the user's intent
- Include 6-10 blocks that make sense for the workflow`;

function buildPrimitivesContext(primitives: AdapterPrimitive[]): string {
  if (primitives.length === 0) return "";

  const byType = {
    objects: primitives.filter((p) => p.type === "object"),
    actions: primitives.filter((p) => p.type === "action"),
    workflows: primitives.filter((p) => p.type === "workflow")
  };

  const components = byType.objects.filter((p) => p.metadata?.kind === "component");
  const styles = byType.objects.filter((p) => p.metadata?.kind === "style");
  const comments = byType.objects.filter((p) => p.metadata?.kind === "comment");
  const versions = byType.objects.filter((p) => p.metadata?.kind === "version");
  const file = byType.objects.find((p) => p.metadata?.kind === "file");

  const lines: string[] = ["CONNECTED PRIMITIVES FROM FIGMA:"];

  if (file) lines.push(`File: "${file.name}" (key: ${file.metadata?.fileKey})`);
  if (components.length > 0) {
    lines.push(`\nComponents (${components.length} total):`);
    components.slice(0, 15).forEach((c) => lines.push(`  - ${c.name} [id:${c.id}]`));
    if (components.length > 15) lines.push(`  ... and ${components.length - 15} more`);
  }
  if (styles.length > 0) {
    lines.push(`\nStyles/Tokens (${styles.length} total):`);
    styles.slice(0, 10).forEach((s) => lines.push(`  - ${s.name} (${s.metadata?.styleType})`));
  }
  if (comments.length > 0) {
    lines.push(`\nRecent comments (${comments.length}):`);
    comments.slice(0, 5).forEach((c) => lines.push(`  - "${c.name}" by ${c.metadata?.author}`));
  }
  if (versions.length > 0) {
    lines.push(`\nVersions:`);
    versions.forEach((v) => lines.push(`  - ${v.name}`));
  }
  if (byType.actions.length > 0) {
    lines.push(`\nAvailable actions: ${byType.actions.map((a) => a.name).join(", ")}`);
  }
  if (byType.workflows.length > 0) {
    lines.push(`\nAvailable workflows: ${byType.workflows.map((w) => w.name).join(", ")}`);
  }

  return lines.join("\n");
}

export async function generateWorkspaceSchema(
  prompt: string,
  primitives: AdapterPrimitive[] = []
): Promise<WorkspaceSchema> {
  const primitivesContext = buildPrimitivesContext(primitives);
  const systemPrompt = primitivesContext
    ? `${baseSystemPrompt}\n\n${primitivesContext}`
    : baseSystemPrompt;

  const fallback = createFallbackWorkspace(prompt, primitives);

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
          max_tokens: 4096,
          temperature: 0.2,
          system: systemPrompt,
          messages: [{ role: "user", content: prompt || "Create a workspace for my connected Figma file." }]
        })
      });

      if (response.ok) {
        const payload = await response.json();
        const text = payload.content?.[0]?.text as string | undefined;
        if (text) {
          const json = text.match(/\{[\s\S]*\}/)?.[0];
          if (json) return JSON.parse(json) as WorkspaceSchema;
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
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt || "Create a workspace for my connected Figma file." }
          ],
          temperature: 0.2
        })
      });

      if (response.ok) {
        const payload = await response.json();
        const content = payload.choices?.[0]?.message?.content as string | undefined;
        if (content) return JSON.parse(content) as WorkspaceSchema;
      }
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function createFallbackWorkspace(prompt: string, primitives: AdapterPrimitive[]): WorkspaceSchema {
  const components = primitives.filter((p) => p.metadata?.kind === "component");
  const styles = primitives.filter((p) => p.metadata?.kind === "style");
  const file = primitives.find((p) => p.metadata?.kind === "file");
  const name = file?.name
    ? `${file.name} Workspace`
    : prompt.trim()
    ? `${prompt.trim().split(/\s+/).slice(0, 4).join(" ")} Workspace`
    : "Untitled Workspace";

  return {
    id: `generated-${Date.now()}`,
    name,
    mode: "custom",
    description: file?.name ? `Live workspace for ${file.name}` : "Generated workspace",
    source: "generated",
    actions: [
      { id: "scan-file", label: "Scan File" },
      { id: "sync-variables", label: "Sync" },
      { id: "export-report", label: "Export" }
    ],
    layout: [
      ...(components.length > 0
        ? [{ type: "metric_card" as const, title: "Components", value: String(components.length), tone: "purple" as const }]
        : []),
      ...(styles.length > 0
        ? [{ type: "metric_card" as const, title: "Styles", value: String(styles.length), tone: "blue" as const }]
        : []),
      ...(components.length > 0
        ? [{
            type: "component_list" as const,
            title: "Components",
            items: components.slice(0, 10).map((c) => ({ id: c.id, title: c.name, status: "stable" }))
          }]
        : []),
      {
        type: "quick_actions" as const,
        title: "Quick actions",
        actions: [
          { id: "scan-file", label: "Scan File" },
          { id: "sync-variables", label: "Sync" },
          { id: "export-report", label: "Export" },
          { id: "cleanup", label: "Suggestions" }
        ]
      }
    ]
  };
}
