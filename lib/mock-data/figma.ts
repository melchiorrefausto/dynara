import type {
  ActivityItem,
  ConnectedApp,
  DevHandoffItem,
  ListItem,
  SuggestionItem,
  TokenItem
} from "@/types/workspace";

export const connectedApps: ConnectedApp[] = [
  { id: "figma", name: "Figma", status: "connected", lastSync: "2 min ago" },
  { id: "notion", name: "Notion", status: "connected", lastSync: "8 min ago" },
  { id: "linear", name: "Linear", status: "connected", lastSync: "12 min ago" },
  { id: "gmail", name: "Gmail", status: "available" },
  { id: "slack", name: "Slack", status: "connected", lastSync: "4 min ago" }
];

export const figmaContext = {
  file: "DS - Core Library.fig",
  branch: "main",
  lastSync: "2 min ago"
};

export const components: ListItem[] = [
  { id: "button-primary", title: "Button / Primary", subtitle: "2 variants", status: "stable" },
  { id: "button-secondary", title: "Button / Secondary", subtitle: "3 variants", status: "stable" },
  { id: "input-text", title: "Input / Text", subtitle: "4 variants", status: "stable" },
  { id: "card-default", title: "Card / Default", subtitle: "2 variants", status: "stable" },
  { id: "modal-center", title: "Modal / Center", subtitle: "3 variants", status: "needs docs" }
];

export const brokenVariants: ListItem[] = [
  {
    id: "button-primary-missing",
    title: "Button / Primary",
    subtitle: "Missing 2 variants",
    severity: "high"
  },
  {
    id: "input-text-missing",
    title: "Input / Text",
    subtitle: "Missing 1 variant",
    severity: "medium"
  },
  {
    id: "toggle-switch-missing",
    title: "Toggle / Switch",
    subtitle: "Missing 3 variants",
    severity: "high"
  },
  {
    id: "card-default-missing",
    title: "Card / Default",
    subtitle: "Missing 2 variants",
    severity: "medium"
  }
];

export const tokens: TokenItem[] = [
  { id: "color-primary", name: "--color-primary", value: "#6366F1", category: "Color" },
  { id: "color-secondary", name: "--color-secondary", value: "#8B5CF6", category: "Color" },
  { id: "color-success", name: "--color-success", value: "#10B981", category: "Color" },
  { id: "color-warning", name: "--color-warning", value: "#F59E0B", category: "Color" },
  { id: "color-danger", name: "--color-danger", value: "#EF4444", category: "Color" }
];

export const documentationStatus: ListItem[] = [
  {
    id: "docs-button",
    title: "Button / Primary",
    subtitle: "Last updated 2 days ago",
    status: "documented"
  },
  {
    id: "docs-card",
    title: "Card / Default",
    subtitle: "Last updated 5 days ago",
    status: "documented"
  },
  {
    id: "docs-modal",
    title: "Modal / Center",
    subtitle: "No documentation",
    status: "missing"
  }
];

export const devHandoffStatus: DevHandoffItem[] = [
  { id: "ready", title: "Ready for dev", count: "48 components", status: "ready" },
  { id: "review", title: "Needs review", count: "12 components", status: "review" },
  { id: "blocked", title: "Not ready", count: "8 components", status: "blocked" }
];

export const aiSuggestions: SuggestionItem[] = [
  {
    id: "standardize-radius",
    title: "Standardize radius",
    description: "4 components use inconsistent radius values.",
    actionLabel: "Apply",
    impact: "Low risk"
  },
  {
    id: "create-variants",
    title: "Create missing variants",
    description: "12 components are missing important variants.",
    actionLabel: "Review",
    impact: "High value"
  },
  {
    id: "rename-tokens",
    title: "Rename tokens",
    description: "8 tokens have unclear names.",
    actionLabel: "Review",
    impact: "Medium"
  },
  {
    id: "document-components",
    title: "Document components",
    description: "23 components are missing descriptions.",
    actionLabel: "Generate Docs",
    impact: "High value"
  }
];

export const activity: ActivityItem[] = [
  { id: "a1", actor: "AI", event: "updated 8 suggestions", time: "2 min ago" },
  { id: "a2", actor: "Figma", event: 'Component "Button / Primary" edited', time: "10 min ago" },
  { id: "a3", actor: "You", event: "synced changes", time: "18 min ago" }
];
