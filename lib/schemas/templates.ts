import {
  activity,
  aiSuggestions,
  brokenVariants,
  components,
  devHandoffStatus,
  documentationStatus,
  tokens
} from "@/lib/mock-data/figma";
import type { WorkspaceMode, WorkspaceSchema } from "@/types/workspace";

const baseActions = [
  { id: "scan-file", label: "Scan File", icon: "search" },
  { id: "cleanup", label: "Cleanup", icon: "sparkles" },
  { id: "sync-variables", label: "Sync Variables", icon: "refresh" },
  { id: "export-report", label: "Export Report", icon: "download" }
];

export const workspaceTemplates: WorkspaceSchema[] = [
  {
    id: "template-design-system",
    name: "Design System Workspace",
    mode: "design_system",
    description: "Components, variables, tokens, broken variants, usage, docs, and handoff.",
    source: "template",
    actions: baseActions,
    layout: [
      { type: "metric_card", title: "Components", value: "256", trend: "+18 this week", tone: "purple" },
      { type: "metric_card", title: "Broken variants", value: "12", trend: "Needs cleanup", tone: "red" },
      { type: "metric_card", title: "Tokens", value: "142", trend: "Synced", tone: "blue" },
      { type: "component_list", title: "Components", items: components, actionLabel: "View all components" },
      { type: "issue_list", title: "Broken Variants", items: brokenVariants, actionLabel: "View all issues" },
      { type: "token_table", title: "Tokens Overview", items: tokens },
      { type: "suggestions", title: "AI Suggestions", items: aiSuggestions },
      {
        type: "list",
        title: "Usage Analytics",
        items: [
          { id: "usage-button", title: "Button / Primary", value: "132" },
          { id: "usage-input", title: "Input / Text", value: "98" },
          { id: "usage-card", title: "Card / Default", value: "76" },
          { id: "usage-icon", title: "Icon / Small", value: "64" }
        ],
        actionLabel: "View full analytics"
      },
      { type: "documentation", title: "Documentation", items: documentationStatus },
      { type: "dev_handoff", title: "Dev Handoff", items: devHandoffStatus },
      { type: "preview", title: "Preview", components: ["Primary Button", "Secondary Button"] },
      { type: "activity_feed", title: "Activity Feed", items: activity },
      { type: "quick_actions", title: "Quick Actions", actions: baseActions }
    ]
  },
  {
    id: "template-developer-handoff",
    name: "Developer Handoff Hub",
    mode: "developer_handoff",
    description: "Ready states, specs, documentation, and implementation blockers.",
    source: "template",
    actions: baseActions,
    layout: [
      { type: "metric_card", title: "Ready for dev", value: "48", trend: "+9 since sync", tone: "green" },
      { type: "metric_card", title: "Needs review", value: "12", trend: "4 owners", tone: "amber" },
      { type: "metric_card", title: "Blocked", value: "8", trend: "Missing specs", tone: "red" },
      { type: "dev_handoff", title: "Dev Handoff", items: devHandoffStatus },
      { type: "documentation", title: "Documentation", items: documentationStatus },
      { type: "suggestions", title: "AI Suggestions", items: aiSuggestions.slice(1, 4) },
      { type: "activity_feed", title: "Activity Feed", items: activity },
      { type: "quick_actions", title: "Quick Actions", actions: baseActions }
    ]
  },
  {
    id: "template-accessibility",
    name: "Accessibility Review",
    mode: "accessibility_review",
    description: "Contrast, keyboard flow, labels, focus states, and remediation tasks.",
    source: "template",
    actions: baseActions,
    layout: [
      { type: "metric_card", title: "Issues", value: "31", trend: "11 high priority", tone: "red" },
      { type: "metric_card", title: "Reviewed screens", value: "64", trend: "82% complete", tone: "blue" },
      { type: "metric_card", title: "Quick fixes", value: "18", trend: "Ready to apply", tone: "green" },
      {
        type: "issue_list",
        title: "Accessibility Issues",
        items: [
          { id: "contrast", title: "Low contrast text", subtitle: "8 components affected", severity: "high" },
          { id: "focus", title: "Missing focus ring", subtitle: "11 interactive elements", severity: "medium" },
          { id: "labels", title: "Ambiguous labels", subtitle: "7 form controls", severity: "medium" },
          { id: "motion", title: "Unlabeled motion", subtitle: "5 prototype frames", severity: "low" }
        ],
        actionLabel: "Open review queue"
      },
      { type: "suggestions", title: "AI Suggestions", items: aiSuggestions.slice(0, 3) },
      { type: "quick_actions", title: "Quick Actions", actions: baseActions }
    ]
  },
  {
    id: "template-client-feedback",
    name: "Client Feedback",
    mode: "client_feedback",
    description: "A simplified review workspace for comments, approvals, and unresolved requests.",
    source: "template",
    actions: baseActions,
    layout: [
      { type: "metric_card", title: "Open comments", value: "42", trend: "13 new", tone: "purple" },
      { type: "metric_card", title: "Approved frames", value: "18", trend: "+6 today", tone: "green" },
      { type: "metric_card", title: "Unassigned", value: "7", trend: "Needs owner", tone: "amber" },
      {
        type: "list",
        title: "Feedback Queue",
        items: [
          { id: "hero-copy", title: "Homepage hero copy", subtitle: "Waiting on brand review", status: "open" },
          { id: "pricing", title: "Pricing page layout", subtitle: "Approved with small copy edits", status: "approved" },
          { id: "mobile-nav", title: "Mobile navigation", subtitle: "Client requested alternate option", status: "open" }
        ],
        actionLabel: "View all feedback"
      },
      { type: "preview", title: "Preview", components: ["Client Review", "Approval Badge"] },
      { type: "activity_feed", title: "Activity Feed", items: activity },
      { type: "quick_actions", title: "Quick Actions", actions: baseActions }
    ]
  },
  {
    id: "template-component-audit",
    name: "Component Audit",
    mode: "component_audit",
    description: "Audit component usage, duplication, stale variants, and cleanup opportunities.",
    source: "template",
    actions: baseActions,
    layout: [
      { type: "metric_card", title: "Duplicate sets", value: "16", trend: "Merge candidates", tone: "amber" },
      { type: "metric_card", title: "Stale components", value: "28", trend: "Not used in 90 days", tone: "red" },
      { type: "metric_card", title: "Cleanup value", value: "64%", trend: "Estimated reduction", tone: "green" },
      { type: "component_list", title: "Components", items: components, actionLabel: "Open component index" },
      { type: "issue_list", title: "Audit Findings", items: brokenVariants, actionLabel: "Resolve findings" },
      { type: "suggestions", title: "AI Suggestions", items: aiSuggestions },
      { type: "quick_actions", title: "Quick Actions", actions: baseActions }
    ]
  }
];

export function getTemplateByMode(mode: WorkspaceMode) {
  return workspaceTemplates.find((template) => template.mode === mode) ?? workspaceTemplates[0];
}

export function inferModeFromPrompt(prompt: string): WorkspaceMode {
  const normalized = prompt.toLowerCase();

  if (normalized.includes("handoff") || normalized.includes("developer")) {
    return "developer_handoff";
  }

  if (normalized.includes("accessibility") || normalized.includes("a11y") || normalized.includes("contrast")) {
    return "accessibility_review";
  }

  if (normalized.includes("client") || normalized.includes("feedback") || normalized.includes("review")) {
    return "client_feedback";
  }

  if (normalized.includes("audit") || normalized.includes("cleanup") || normalized.includes("duplicate")) {
    return "component_audit";
  }

  return "design_system";
}

export function createMockGeneratedWorkspace(prompt: string): WorkspaceSchema {
  const mode = inferModeFromPrompt(prompt);
  const template = getTemplateByMode(mode);

  return {
    ...template,
    id: `generated-${mode}-${Date.now()}`,
    name: template.name,
    source: "generated",
    description: `Generated from: "${prompt || "Create a design system cleanup workspace"}"`,
    savedAt: new Date().toISOString()
  };
}
