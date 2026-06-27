export type WorkspaceMode =
  | "design_system"
  | "developer_handoff"
  | "accessibility_review"
  | "client_feedback"
  | "component_audit"
  | "mobile_app"
  | "custom";

export type WorkspaceAction = {
  id: string;
  label: string;
  description?: string;
  icon?: string;
};

export type AdapterPrimitive = {
  id: string;
  source: "figma" | "notion" | "linear" | "gmail" | "slack";
  type: "object" | "action" | "permission" | "workflow";
  name: string;
  metadata?: Record<string, string | number | boolean>;
};

export type ConnectedApp = {
  id: string;
  name: string;
  status: "connected" | "available" | "syncing";
  lastSync?: string;
};

export type MetricBlock = {
  type: "metric_card";
  title: string;
  value: string;
  trend?: string;
  tone?: "purple" | "blue" | "green" | "amber" | "red";
};

export type ListItem = {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  severity?: "low" | "medium" | "high";
  value?: string;
};

export type ListBlock = {
  type: "list" | "component_list" | "issue_list";
  title: string;
  items: ListItem[];
  actionLabel?: string;
};

export type TokenItem = {
  id: string;
  name: string;
  value: string;
  category: "Color" | "Typography" | "Spacing" | "Radius" | "Effect";
};

export type TokenTableBlock = {
  type: "token_table";
  title: string;
  items: TokenItem[];
};

export type SuggestionItem = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  impact?: string;
};

export type SuggestionsBlock = {
  type: "suggestions";
  title: string;
  items: SuggestionItem[];
};

export type ActivityItem = {
  id: string;
  actor: string;
  event: string;
  time: string;
};

export type ActivityBlock = {
  type: "activity_feed";
  title: string;
  items: ActivityItem[];
};

export type QuickActionsBlock = {
  type: "quick_actions";
  title: string;
  actions: WorkspaceAction[];
};

export type DevHandoffItem = {
  id: string;
  title: string;
  count: string;
  status: "ready" | "review" | "blocked";
};

export type DevHandoffBlock = {
  type: "dev_handoff";
  title: string;
  items: DevHandoffItem[];
};

export type DocumentationBlock = {
  type: "documentation";
  title: string;
  items: ListItem[];
};

export type PreviewBlock = {
  type: "preview";
  title: string;
  components: string[];
};

export type WorkspaceBlock =
  | MetricBlock
  | ListBlock
  | TokenTableBlock
  | SuggestionsBlock
  | ActivityBlock
  | QuickActionsBlock
  | DevHandoffBlock
  | DocumentationBlock
  | PreviewBlock;

export type WorkspaceSchema = {
  id: string;
  name: string;
  mode: WorkspaceMode;
  description: string;
  source: "template" | "generated";
  layout: WorkspaceBlock[];
  actions: WorkspaceAction[];
  savedAt?: string;
};
