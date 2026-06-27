import type { WorkspaceSchema } from "@/types/workspace";

const systemPrompt = `You generate Dynara workspace schemas. Return only JSON that matches this shape:
{
  "id": "string",
  "name": "string",
  "mode": "design_system | developer_handoff | accessibility_review | client_feedback | component_audit | mobile_app | custom",
  "description": "string",
  "source": "generated",
  "actions": [{"id":"scan-file","label":"Scan File"}],
  "layout": []
}
Use only supported block types: metric_card, component_list, issue_list, list, token_table, suggestions, activity_feed, quick_actions, dev_handoff, documentation, preview.`;

export async function generateWorkspaceSchema(prompt: string): Promise<WorkspaceSchema> {
  const fallback = createGeneratedFallbackWorkspace(prompt);

  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: 0.2
        })
      });

      if (response.ok) {
        const payload = await response.json();
        const content = payload.choices?.[0]?.message?.content;
        if (content) {
          return JSON.parse(content) as WorkspaceSchema;
        }
      }
    } catch {
      return fallback;
    }
  }

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
          model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest",
          max_tokens: 2200,
          temperature: 0.2,
          system: systemPrompt,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (response.ok) {
        const payload = await response.json();
        const content = payload.content?.[0]?.text;
        if (content) {
          return JSON.parse(content) as WorkspaceSchema;
        }
      }
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function createGeneratedFallbackWorkspace(prompt: string): WorkspaceSchema {
  const normalizedPrompt = prompt.trim();
  const name = normalizedPrompt
    ? `${normalizedPrompt.split(/\s+/).slice(0, 4).join(" ")} Workspace`
    : "Untitled Workspace";

  return {
    id: `generated-${Date.now()}`,
    name,
    mode: "custom",
    description: normalizedPrompt ? `Generated from: "${normalizedPrompt}"` : "Blank generated workspace.",
    source: "generated",
    actions: [
      { id: "scan-file", label: "Scan File", icon: "search" },
      { id: "cleanup", label: "Cleanup", icon: "sparkles" },
      { id: "sync-variables", label: "Sync Variables", icon: "refresh" },
      { id: "export-report", label: "Export Report", icon: "download" }
    ],
    layout: [
      {
        type: "quick_actions",
        title: "Quick Actions",
        actions: [
          { id: "scan-file", label: "Scan File" },
          { id: "cleanup", label: "Cleanup" },
          { id: "sync-variables", label: "Sync Variables" },
          { id: "export-report", label: "Export Report" }
        ]
      },
      {
        type: "activity_feed",
        title: "Activity Feed",
        items: []
      }
    ]
  };
}
