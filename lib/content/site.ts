import type { LucideIcon } from "lucide-react";
import {
  Code2,
  Figma,
  LockKeyhole,
  Puzzle,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Workflow
} from "lucide-react";

export const navLinks: { href: string; label: string }[] = [
  { href: "/product", label: "Product" },
  { href: "/developers", label: "Developers" },
  { href: "/platform", label: "Platform" },
  { href: "/use-cases", label: "Use cases" },
  { href: "/company", label: "Company" },
  { href: "/pricing", label: "Pricing" }
];

export const trustSignals: { icon: LucideIcon; label: string }[] = [
  { icon: Workflow, label: "Developer-first" },
  { icon: Target, label: "Secure by design" },
  { icon: ShieldCheck, label: "Works with any app" }
];

export const heroFeatures: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Sparkles,
    title: "User-specific interfaces",
    description: "Generate focused layouts from app surfaces, tasks, and user preferences."
  },
  {
    icon: Puzzle,
    title: "App-owned control",
    description: "The host software decides which surfaces, actions, and tokens Dynara is allowed to change."
  },
  {
    icon: Code2,
    title: "Built for developers",
    description: "Start with local code import, then graduate to SDK and API-based software schemas."
  }
];

export const platform: { icon: LucideIcon; label: string; description: string; tint: string }[] = [
  {
    icon: Code2,
    label: "Code import",
    description: "Scan a local software project and turn rendered UI sections into customizable surfaces.",
    tint: "bg-violet-100 text-violet-600"
  },
  {
    icon: Puzzle,
    label: "Runtime SDK",
    description: "Expose app surfaces, views, actions, profiles, and constraints directly from the host product.",
    tint: "bg-sky-100 text-sky-600"
  },
  {
    icon: Figma,
    label: "Design system sync",
    description: "Connect design tokens, component metadata, and product schemas from Figma or your own API.",
    tint: "bg-indigo-100 text-indigo-600"
  },
  {
    icon: ShieldCheck,
    label: "Safety contract",
    description: "Define what users can change while preserving required navigation, permissions, and product logic.",
    tint: "bg-rose-100 text-rose-600"
  }
];

export const useCases: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Search,
    title: "Design system workspaces",
    description: "Surface components, tokens, variants, and documentation in a workspace tailored to each role."
  },
  {
    icon: Settings,
    title: "Operator dashboards",
    description: "Let users simplify dense internal tools into focused layouts without losing the underlying product."
  },
  {
    icon: LockKeyhole,
    title: "Accessibility modes",
    description: "Generate high-contrast, reduced-motion, larger-text, and simpler-navigation profiles."
  },
  {
    icon: Star,
    title: "Client review modes",
    description: "Hide implementation detail and expose only the surfaces, comments, and actions a reviewer needs."
  }
];

export const developerSteps: { badge: string; title: string; body: string; code: string }[] = [
  {
    badge: "Level 1 - Local test",
    title: "Import a code folder",
    body: "Select the software project folder, choose the main UI file, and let Dynara suggest customizable surfaces.",
    code: `// Example surfaces Dynara can discover
<Sidebar />
<Toolbar />
<InspectorPanel />
<Canvas />`
  },
  {
    badge: "Level 2 - Manifest",
    title: "/.well-known/dynara.json",
    body: "Publish a static schema that declares surfaces, profiles, views, actions, and safety constraints.",
    code: `{
  "name": "Example App",
  "surfaces": [
    { "id": "sidebar", "label": "Sidebar" }
  ],
  "profiles": [
    { "id": "focus", "label": "Focus mode" }
  ]
}`
  },
  {
    badge: "Level 3 - SDK/API",
    title: "App-native runtime",
    body: "Let Dynara trigger safe host actions and apply app-approved profiles through a native integration contract.",
    code: `Dynara.init({ name, surfaces, actions });
Dynara.action("open-command-menu", () => {
  app.commands.open();
});`
  }
];

export const pricingTiers: {
  name: string;
  price: string;
  detail: string;
  cubes: number;
  features: string[];
}[] = [
  {
    name: "Prototype",
    price: "$0",
    detail: "Local code import, SDK manifest generation, and browser-extension testing.",
    cubes: 2,
    features: ["Local code import", "SDK manifest generator", "Browser-extension testing", "1 workspace"]
  },
  {
    name: "Team",
    price: "Soon",
    detail: "Shared projects, schema history, generated profiles, and connected design systems.",
    cubes: 3,
    features: ["Shared projects", "Schema version history", "Generated user profiles", "Figma design sync"]
  },
  {
    name: "Enterprise",
    price: "Custom",
    detail: "Private adapters, governance, audit trails, and app-native runtime controls.",
    cubes: 4,
    features: ["Private adapters", "Governance & permissions", "Audit trails", "App-native runtime controls"]
  }
];
