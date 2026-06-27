import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Braces,
  CheckCircle2,
  Code2,
  Figma,
  Github,
  Layers3,
  Mail,
  MessageSquare,
  Puzzle,
  Slack,
  Sparkles,
  Workflow
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DynaraLogo } from "@/components/ui/logo";

const useCases = [
  {
    title: "Design system management",
    description: "Track components, tokens, broken variants, and documentation in one generated workspace."
  },
  {
    title: "Developer handoff",
    description: "Turn design primitives into implementation queues, readiness states, and exportable specs."
  },
  {
    title: "Accessibility review",
    description: "Scan contrast, labels, focus states, and remediation tasks without rebuilding your toolchain."
  },
  {
    title: "Client feedback",
    description: "Shape a focused review surface for comments, approvals, and simplified collaboration."
  }
];

const pricing = [
  { name: "Starter", price: "$0", detail: "Mock Figma workspaces and schema templates." },
  { name: "Team", price: "Soon", detail: "Shared templates, connected apps, and AI actions." },
  { name: "Enterprise", price: "Custom", detail: "Runtime governance, permissions, and private adapters." }
];

export default function LandingPage() {
  return (
    <main className="bg-white text-slate-950">
      <section className="landing-hero overflow-hidden">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-6 text-white">
          <Link href="/" aria-label="Dynara home">
            <DynaraLogo />
          </Link>
          <div className="hidden items-center gap-10 text-sm font-semibold text-white/82 md:flex">
            <a href="#product">Product</a>
            <a href="#developers">Developers</a>
            <a href="#integrations">Integrations</a>
            <a href="#resources">Resources</a>
            <a href="#company">Company</a>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="secondary" className="hidden border-white/20 bg-white/5 text-white hover:bg-white/10 sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </nav>

        <div className="mx-auto grid max-w-7xl gap-12 px-6 pb-16 pt-16 lg:grid-cols-[1.3fr_0.9fr] lg:pb-24 lg:pt-24">
          <div>
            <Badge tone="purple" className="border border-primary/30 bg-white/10 text-white">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              The interface layer for AI-native software
            </Badge>
            <h1 className="mt-8 max-w-4xl text-6xl font-black tracking-normal text-white text-balance md:text-7xl">
              Software adapts to <span className="text-primary">every</span> user.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-700">
              Dynara is the runtime for dynamic software interfaces. Expose your primitives. We&apos;ll
              build the perfect interface for every user, every task, every time.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg">
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

          <div className="space-y-8 border-white/15 text-white lg:border-l lg:pl-14">
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
        <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="min-w-0">
            <Badge tone="blue">Developer runtime</Badge>
            <h2 className="mt-4 text-4xl font-bold tracking-normal text-balance">
              Expose objects, actions, permissions, and workflows. Dynara generates the interface.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Keep your source of truth inside your product. Dynara reads your primitives, understands
              the user&apos;s goal, and renders a schema-driven workspace without generating arbitrary code.
            </p>
          </div>
          <div className="min-w-0 rounded-lg border border-border bg-slate-950 p-5 text-sm text-slate-200 shadow-soft">
            <div className="mb-4 flex items-center gap-2 text-slate-400">
              <Braces className="h-4 w-4" />
              workspace.schema.json
            </div>
            <pre className="max-w-full overflow-x-auto leading-7">
{`{
  "name": "Design System Workspace",
  "mode": "design_system",
  "layout": [
    { "type": "metric_card", "title": "Components", "value": "256" },
    { "type": "issue_list", "title": "Broken Variants" },
    { "type": "token_table", "title": "Tokens Overview" },
    { "type": "suggestions", "title": "AI Suggestions" }
  ]
}`}
            </pre>
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
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <h3 className="mt-5 text-lg font-bold">{useCase.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <Badge tone="gray">Pricing</Badge>
              <h2 className="mt-4 text-4xl font-bold tracking-normal">Start with adaptive workspaces.</h2>
              <p className="mt-3 text-muted-foreground">Start with adaptive workspaces and scale into connected runtime workflows.</p>
            </div>
            <Button asChild>
              <Link href="/signup">Create workspace</Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {pricing.map((plan) => (
              <div key={plan.name} className="rounded-lg border border-border bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="mt-4 text-4xl font-black tracking-normal">{plan.price}</p>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{plan.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer id="company" className="border-t border-border bg-white">
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
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-white/15 text-white ring-1 ring-white/15">
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-2 max-w-sm text-base leading-7 text-white/72">{children}</p>
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
                  index === 0 ? "bg-primary/10 text-slate-950" : "text-slate-600"
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
                <p className="text-2xl font-bold text-primary">{value}</p>
                <p className="text-sm font-semibold text-slate-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            {["Button", "Input field", "Card", "Avatar"].map((item, index) => (
              <div key={item} className="rounded-lg border border-border bg-white p-4">
                <div className="mb-5 grid h-14 place-items-center rounded-lg bg-slate-50">
                  {index === 0 ? (
                    <span className="rounded-lg bg-primary px-8 py-2 text-sm font-bold text-white">Button</span>
                  ) : (
                    <Workflow className="h-6 w-6 text-slate-400" />
                  )}
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
            <Button className="mt-3 h-9 w-9 p-0" aria-label="Send prompt">
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
          <Badge tone="purple" className="mt-4">
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
