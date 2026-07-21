import Link from "next/link";
import { ArrowRight, CheckCircle2, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { DeveloperStep } from "@/components/marketing/developer-step";
import { ProductMockup } from "@/components/marketing/product-mockup";
import { AnimatedBorder } from "@/components/marketing/animated-border";
import { Reveal } from "@/components/marketing/reveal";
import { RotatingWord } from "@/components/marketing/rotating-word";
import { HeroParticles } from "@/components/marketing/hero-particles";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import {
  developerSteps,
  faqs,
  integrationSources,
  platform,
  pricingTiers,
  trustSignals,
  useCases
} from "@/lib/content/site";

export default function HomePage() {
  return (
    <main className="bg-white text-slate-950">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <HeroParticles />
        <Reveal className="relative mx-auto max-w-4xl px-6 pb-10 pt-14 text-center lg:pt-20">
          <Badge tone="gray" className="border border-border bg-white text-slate-600">
            <Hash className="mr-2 h-3.5 w-3.5 text-primary" />
            Adaptive interface runtime
          </Badge>
          <h1 className="mt-8 text-balance text-5xl font-black tracking-normal text-slate-950 md:text-7xl">
            Software adapts to <RotatingWord />.
          </h1>
          <p className="mx-auto mt-6 max-w-4xl text-xl leading-8 text-slate-600">
            Dynara lets software teams expose app structure, design systems, and safe actions so each user can
            generate a personal interface without breaking the product.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="animate-button-glow">
              <Link href="/signup">
                Start your project
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/login">Open workspace</Link>
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-muted-foreground">
            {trustSignals.map((signal) => (
              <div key={signal.label} className="flex items-center gap-2">
                <signal.icon className="h-4 w-4 text-primary" />
                {signal.label}
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={200} className="relative mx-auto max-w-6xl px-6 pb-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-10 -top-4 bottom-10 -z-10 animate-pulse-glow rounded-[2rem] bg-primary/25 blur-3xl"
          />
          <AnimatedBorder>
            <ProductMockup />
          </AnimatedBorder>
        </Reveal>
      </section>

      <section className="border-y border-border bg-white py-10">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Bring your app&apos;s structure in from
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {integrationSources.map((source, index) => (
              <Reveal key={source.label} delay={index * 80} className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <source.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">{source.label}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{source.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="flex items-center justify-between gap-4">
            <p className="text-sm font-bold uppercase tracking-normal text-muted-foreground">
              One runtime contract for customizable software
            </p>
            <Link href="/platform" className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
              Explore the platform
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Reveal>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {platform.map((item, index) => (
              <Reveal key={item.label} delay={index * 100}>
                <div className="h-full rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <div className={`grid h-11 w-11 place-items-center rounded-xl ${item.tint}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-5 text-lg font-bold">{item.label}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-3xl">
              <Badge tone="blue">Developer integration</Badge>
              <h2 className="mt-4 text-4xl font-bold tracking-normal text-balance">
                Start locally, then integrate natively.
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                The fastest MVP test is importing a local app folder. The production path is an SDK or API integration
                where the software publishes its schema, design system, actions, and constraints.
              </p>
            </div>
            <Link href="/developers" className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
              View integration docs
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Reveal>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {developerSteps.map((step, index) => (
              <Reveal key={step.title} delay={index * 100} className="min-w-0">
                <DeveloperStep {...step} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-3xl">
              <Badge tone="purple">Use cases</Badge>
              <h2 className="mt-4 text-4xl font-bold tracking-normal">
                Personal workspaces for complex software.
              </h2>
            </div>
            <Link href="/use-cases" className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
              See all use cases
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {useCases.map((useCase, index) => (
              <Reveal key={useCase.title} delay={index * 100}>
                <div className="h-full rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <div className="grid h-11 w-11 place-items-center rounded-lg border border-border bg-white shadow-sm">
                    <useCase.icon className="h-5 w-5 text-slate-700" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{useCase.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{useCase.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="text-center">
            <Badge tone="gray" className="border border-border bg-white text-slate-600">
              Pricing
            </Badge>
            <h2 className="mt-4 text-4xl font-bold tracking-normal">Simple, transparent pricing.</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Start with local testing, then scale into connected runtime workflows for real software products.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {pricingTiers.map((plan, index) => (
              <Reveal key={plan.name} delay={index * 100}>
                <div
                  className={`flex h-full flex-col rounded-2xl border p-6 shadow-purple ${
                    plan.featured ? "border-primary bg-white ring-2 ring-primary" : "border-border bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    {plan.featured ? <Badge tone="purple">Most popular</Badge> : null}
                  </div>
                  <p className="mt-3 text-4xl font-black tracking-normal">{plan.price}</p>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{plan.detail}</p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="mt-8 w-full" variant={plan.featured ? "default" : "secondary"}>
                    <Link href="/signup">{plan.price === "Custom" ? "Talk to us" : "Get started"}</Link>
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="text-center">
            <Badge tone="gray" className="border border-border bg-white text-slate-600">
              FAQ
            </Badge>
            <h2 className="mt-4 text-4xl font-bold tracking-normal">Questions, answered.</h2>
          </Reveal>
          <div className="mt-10">
            <FaqAccordion items={faqs} />
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-slate-950 px-8 py-16 text-center text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 animate-glow-drift rounded-full bg-primary/40 blur-3xl"
          />
          <h2 className="relative text-3xl font-bold tracking-normal md:text-4xl">
            Ready to give every user their own interface?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-slate-300">
            Import a local project, publish a manifest, and generate the first workspace in minutes.
          </p>
          <div className="relative mt-8 flex justify-center">
            <Button asChild size="lg">
              <Link href="/signup">
                Start your project
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  );
}
