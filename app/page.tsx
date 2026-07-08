import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock,
  Code2,
  Figma,
  Github,
  Hash,
  Layers3,
  Mail,
  MessageSquare,
  Puzzle,
  Search,
  Settings,
  Slack,
  Sparkles,
  Star,
  Workflow
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DynaraLogo } from "@/components/ui/logo";

const navLinks = [
  { href: "#product", label: "Product" },
  { href: "#developers", label: "Developers" },
  { href: "#integrations", label: "Integrations" },
  { href: "#resources", label: "Resources" },
  { href: "#company", label: "Company" }
];

const useCases = [
  {
    icon: Search,
    title: "Design system management",
    description: "Track components, tokens, broken variants, and documentation in one generated workspace."
  },
  {
    icon: Settings,
    title: "Developer handoff",
    description: "Turn design primitives into implementation queues, readiness states, and exportable specs."
  },
  {
    icon: Clock,
    title: "Accessibility review",
    description: "Scan contrast, labels, focus states, and remediation tasks without rebuilding your toolchain."
  },
  {
    icon: Star,
    title: "Client feedback",
    description: "Shape a focused review surface for comments, approvals, and simplified collaboration."
  }
];

const pricing = [
  { name: "Starter", price: "$0", detail: "Mock Figma workspaces and schema templates.", cubes: 2 },
  { name: "Team", price: "Soon", detail: "Shared templates, connected apps, and AI actions.", cubes: 3 },
  { name: "Enterprise", price: "Custom", detail: "Runtime governance, permissions, and private adapters.", cubes: 4 }
];

export default function LandingPage() {
  return (
    <main className="bg-white text-slate-950">
      <header className="sticky top-0 z-20 border-b border-border bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <Link href="/" aria-label="Dynara home">
            <DynaraLogo />
          </Link>
          <div className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-slate-950">
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="secondary" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild variant="dark" size="sm">
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </nav>
      </header>

      <section className="overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 pb-16 pt-16 lg:grid-cols-[1.3fr_0.9fr] lg:pb-24 lg:pt-24">
          <div>
            <Badge tone="gray" className="border border-border bg-white text-slate-600">
              <Hash className="mr-2 h-3.5 w-3.5" />
              The interface layer for AI-native software
            </Badge>
            <h1 className="mt-8 max-w-4xl text-6xl font-black tracking-normal text-slate-950 text-balance md:text-7xl">
              Software adapts to <span className="text-teal-600">every</span> user.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-600">
              Dynara is the runtime for dynamic software interfaces. Expose your primitives. We&apos;ll
              build the perfect interface for every user, every task, every time.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild variant="dark" size="lg">
                <Link href="/signup">
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/login">Talk to us</Link>
              </Button>
            </div>
          </div>

          <div className="space-y-8">
            <Feature icon={Sparkles} title="AI-powered interface runtime">
              AI composes the optimal interface from your app primitives.
            </Feature>
            <Feature icon={Puzzle} title="Plug into any app">
              Integrate once. Empower every user with limitless customization.
            </Feature>
            <Feature icon={Code2} title="Built for developers">
              APIs, SDKs, and docs to make your app AI-native and future-ready.
            </Feature>
          </div>
        </div>

        <div id="product" className="mx-auto max-w-6xl px-6 pb-10">
          <ProductMockup />
        </div>
      </section>

      <section id="integrations" className="border-y border-border bg-white py-10">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-sm font-bold uppercase tracking-normal text-muted-foreground">
            Powering the next generation of software
          </p>
          <div className="mt-8 grid grid-cols-2 gap-5 text-slate-500 sm:grid-cols-5">
            <LogoMark icon={Figma} label="Figma" />
            <LogoMark icon={Boxes} label="Notion" />
            <LogoMark icon={Github} label="Linear" />
            <LogoMark icon={Mail} label="Gmail" />
            <LogoMark icon={Slack} label="Slack" />
          </div>
        </div>
      </section>

      <section id="developers" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <Badge tone="blue">Developer integration</Badge>
            <h2 className="mt-4 text-4xl font-bold tracking-normal text-balance">
              Make your app customizable from the Dynara extension — three levels, pick one.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              No account, no API key, no backend call required. Dynara discovers your UI directly from
              your own page, in increasing order of control.
            </p>
            <a
              href="/demo/index.html"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-teal-600"
            >
              Open the live demo <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
              <Badge tone="gray">Level 1 — Zero code</Badge>
              <h3 className="mt-4 text-lg font-bold">Auto-discovery</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Mark any section with <code className="rounded bg-slate-100 px-1 py-0.5">data-dynara-panel</code>.
                The extension finds it with no script and no manifest file.
              </p>
              <pre className="mt-4 overflow-x-auto rounded-md bg-slate-950 p-3 text-xs leading-6 text-slate-200">
{`<section
  data-dynara-panel="stats"
  data-dynara-label="Statistics">
  ...
</section>`}
              </pre>
            </div>

            <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
              <Badge tone="purple">Level 2 — Manifest file</Badge>
              <h3 className="mt-4 text-lg font-bold">/.well-known/dynara.json</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Publish a static manifest naming your panels, plus grouped <strong>views</strong> the user
                can switch between (e.g. &quot;Generator only&quot;).
              </p>
              <pre className="mt-4 overflow-x-auto rounded-md bg-slate-950 p-3 text-xs leading-6 text-slate-200">
{`{
  "name": "Numerix",
  "panels": [
    { "id": "stats", "label": "Statistics",
      "selector": "[data-dynara-panel='stats']" }
  ],
  "views": [
    { "id": "focus", "label": "Generator only",
      "panels": ["generator"] }
  ]
}`}
              </pre>
            </div>

            <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
              <Badge tone="blue">Level 3 — SDK + actions</Badge>
              <h3 className="mt-4 text-lg font-bold">One script tag</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Add the SDK and declare real actions. The extension can now trigger your app&apos;s own
                logic, not just hide/show DOM.
              </p>
              <pre className="mt-4 overflow-x-auto rounded-md bg-slate-950 p-3 text-xs leading-6 text-slate-200">
{`<script src="https://dynara.io/sdk/v1.js">
</script>
<script>
  Dynara.init({ name: "Numerix", panels, actions });
  Dynara.action("generate", () => generate());
</script>`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section id="resources" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <Badge tone="purple">Figma MVP</Badge>
            <h2 className="mt-4 text-4xl font-bold tracking-normal">
              Turn Figma into a design system workspace, developer handoff hub, accessibility reviewer, or client review tool.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {useCases.map((useCase) => (
              <div key={useCase.title} className="rounded-lg border border-border bg-white p-5 shadow-sm">
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-white shadow-sm">
                  <useCase.icon className="h-5 w-5 text-slate-700" />
                </div>
                <h3 className="mt-5 text-lg font-bold">{useCase.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="company" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <Badge tone="gray">Pricing</Badge>
              <h2 className="mt-4 text-4xl font-bold tracking-normal">Start with adaptive workspaces.</h2>
              <p className="mt-3 text-muted-foreground">Start with adaptive workspaces and scale into connected runtime workflows.</p>
            </div>
            <Button asChild variant="dark">
              <Link href="/signup">Create workspace</Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {pricing.map((plan) => (
              <div key={plan.name} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-white p-6 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="mt-4 text-4xl font-black tracking-normal">{plan.price}</p>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{plan.detail}</p>
                </div>
                <CubeCluster count={plan.cubes} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <DynaraLogo />
          <p className="text-sm text-muted-foreground">Dynara turns software primitives into adaptive interfaces.</p>
          <div className="flex gap-5 text-sm font-semibold text-slate-600">
            <Link href="/login">Sign in</Link>
            <Link href="/signup">Get started</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Feature({
  icon: Icon,
  title,
  children
}: {
  icon: typeof Sparkles;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-5">
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-border bg-white shadow-sm">
        <Icon className="h-6 w-6 text-slate-700" />
      </div>
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-2 max-w-sm text-base leading-7 text-slate-600">{children}</p>
      </div>
    </div>
  );
}

function LogoMark({ icon: Icon, label }: { icon: typeof Figma; label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 text-xl font-bold">
      <Icon className="h-7 w-7" />
      {label}
    </div>
  );
}

function CubeCluster({ count }: { count: number }) {
  const cubes = Array.from({ length: count });
  return (
    <svg viewBox="0 0 90 90" className="h-20 w-20 shrink-0 text-slate-300" fill="none" xmlns="http://www.w3.org/2000/svg">
      {cubes.map((_, index) => {
        const offset = index * 14;
        const x = 12 + (index % 2 === 0 ? 0 : 18) + offset * 0.35;
        const y = 60 - offset;
        return (
          <g key={index} transform={`translate(${x}, ${y})`}>
            <path d="M0 8 L14 0 L28 8 L14 16 Z" className="fill-slate-200" />
            <path d="M0 8 L14 16 L14 30 L0 22 Z" className="fill-slate-400" />
            <path d="M28 8 L14 16 L14 30 L28 22 Z" className="fill-slate-950" />
          </g>
        );
      })}
    </svg>
  );
}

function ProductMockup() {
  return (
    <div className="glass-panel overflow-hidden rounded-lg">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
          <Layers3 className="h-4 w-4" />
          Acme Design System
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary">Share</Button>
          <Button size="sm" variant="secondary">Export</Button>
          <Button size="sm" variant="dark">New view</Button>
        </div>
      </div>
      <div className="grid min-h-[420px] lg:grid-cols-[250px_1fr_300px]">
        <aside className="hidden border-r border-border bg-white/62 p-5 lg:block">
          <p className="mb-4 text-xs font-bold uppercase tracking-normal text-muted-foreground">Workspaces</p>
          {["Design System Hub", "Developer Handoff", "Accessibility Review", "Client Feedback", "Component Audit"].map(
            (item, index) => (
              <div
                key={item}
                className={`mb-2 rounded-lg px-3 py-3 text-sm font-semibold ${
                  index === 0 ? "bg-slate-100 text-slate-950" : "text-slate-600"
                }`}
              >
                {item}
              </div>
            )
          )}
        </aside>
        <div className="p-6">
          <h3 className="text-2xl font-bold">Design System Hub</h3>
          <p className="mt-2 text-sm text-muted-foreground">All your design system assets organized your way.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            {[
              ["132", "Components"],
              ["24", "Libraries"],
              ["8", "Projects"],
              ["3", "Updates"]
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-border bg-white p-4">
                <p className="text-2xl font-bold text-slate-950">{value}</p>
                <p className="text-sm font-semibold text-slate-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            {["Button", "Input field", "Card", "Avatar"].map((item, index) => (
              <div key={item} className="rounded-lg border border-border bg-white p-4">
                <div
                  className={`mb-5 grid h-14 place-items-center rounded-lg ${
                    index === 0 ? "bg-slate-950" : "bg-slate-50"
                  }`}
                >
                  <Workflow className={`h-6 w-6 ${index === 0 ? "text-white" : "text-slate-400"}`} />
                </div>
                <p className="text-sm font-bold">{item}</p>
                <p className="mt-1 text-xs text-muted-foreground">{24 - index * 6} variants</p>
              </div>
            ))}
          </div>
        </div>
        <aside className="border-l border-border bg-white/72 p-5">
          <p className="text-sm font-bold">What would you like to focus on?</p>
          <div className="mt-4 rounded-lg border border-border bg-white p-3 text-sm leading-6 text-slate-600">
            Show me components used in the checkout flow and highlight accessibility issues.
            <Button variant="dark" className="mt-3 h-9 w-9 p-0" aria-label="Send prompt">
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
          <Badge tone="gray" className="mt-4 border border-border bg-white text-slate-600">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            AI is reasoning...
          </Badge>
          <div className="mt-5 space-y-3 text-sm font-semibold text-slate-700">
            {["Checkout flow components", "Accessibility audit", "Improvement suggestions"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {item}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
