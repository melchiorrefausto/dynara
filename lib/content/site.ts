import type { LucideIcon } from "lucide-react";
import {
  Braces,
  Code2,
  FolderCode,
  Gauge,
  Lock,
  LockKeyhole,
  Palette,
  Puzzle,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Target,
  Workflow,
  Zap
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
    icon: Palette,
    label: "Design system sync",
    description: "Connect design tokens, component metadata, and product schemas from your own API — works with LLM-based and traditional software alike.",
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
  featured?: boolean;
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
    features: ["Shared projects", "Schema version history", "Generated user profiles", "Design system sync"],
    featured: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    detail: "Private adapters, governance, audit trails, and app-native runtime controls.",
    cubes: 4,
    features: ["Private adapters", "Governance & permissions", "Audit trails", "App-native runtime controls"]
  }
];

export const integrationSources: { icon: LucideIcon; label: string; description: string }[] = [
  {
    icon: FolderCode,
    label: "Local code",
    description: "Scan a project folder and detect customizable UI sections automatically."
  },
  {
    icon: Braces,
    label: "Your own API",
    description: "Publish a dynara.json manifest or call the SDK from any backend."
  },
  {
    icon: Tag,
    label: "Data attributes",
    description: "Drop data-dynara-panel attributes in your markup for instant, zero-config auto-discovery."
  }
];

export const comparisonRows: { icon: LucideIcon; title: string; dynara: string; agentic: string }[] = [
  {
    icon: Zap,
    title: "How changes happen",
    dynara: "Instant CSS/DOM toggles from a manifest you control — no model call, no wait.",
    agentic: "An agent generates new UI live from a prompt, then calls your API to build it."
  },
  {
    icon: Gauge,
    title: "Runtime cost",
    dynara: "Zero inference cost. Every toggle is a client-side change, not an API call.",
    agentic: "Every interaction is a live agent run — ongoing inference cost and latency."
  },
  {
    icon: Lock,
    title: "API exposure",
    dynara: "None. Dynara never touches your backend — only pre-declared front-end surfaces.",
    agentic: "Your API is modeled as agent-callable tools, including writes and deletes."
  },
  {
    icon: ShieldCheck,
    title: "Safety model",
    dynara: "Closed set: users can only reveal, hide, or restyle what you explicitly declared.",
    agentic: "Permission-gated agent actions with read/write/destructive tiers to manage."
  },
  {
    icon: Code2,
    title: "Setup",
    dynara: "Add data attributes or publish a JSON manifest. No API schema required.",
    agentic: "Scans your app and models your real API as a tool schema with permissions."
  },
  {
    icon: Target,
    title: "Best fit",
    dynara: "Accessibility modes, white-label theming, reading views, safe self-serve customization.",
    agentic: "Open-ended, on-demand feature generation and standing automations."
  }
];

export const faqs: { question: string; answer: string }[] = [
  {
    question: "Do I need a credit card to start?",
    answer: "No. The Prototype tier is free — import a local project and generate your first manifest without billing details."
  },
  {
    question: "Can I self-host the runtime?",
    answer: "Enterprise plans include private adapters and app-native runtime controls so you can run Dynara inside your own infrastructure."
  },
  {
    question: "What happens when I outgrow Prototype?",
    answer: "Team unlocks shared projects and schema history; Enterprise adds governance, audit trails, and dedicated support for production rollouts."
  },
  {
    question: "What can a generated interface actually change?",
    answer: "Only what your app's manifest explicitly allows — surfaces, tokens, and actions you publish. Required navigation and permissions can never be hidden."
  },
  {
    question: "Does this work with my existing design system?",
    answer: "Yes. Connect your own token API so generated profiles stay in sync with your real components, not a copy of them."
  },
  {
    question: "How is this different from feature flags?",
    answer: "Feature flags toggle code paths you control. Dynara generates per-user interface profiles on top of a contract your app defines, without a redeploy."
  },
  {
    question: "How is Dynara different from agentic customization tools?",
    answer: "Agentic tools generate new functionality live by calling your API — powerful, but it comes with inference cost, latency, and a real API attack surface to govern. Dynara is deterministic: users can only reveal, hide, reskin, or reflow the surfaces you explicitly declared, instantly, with zero model calls and zero backend exposure. If you want safe, instant self-serve customization without opening your API to an agent, Dynara is the simpler layer for that job."
  }
];
