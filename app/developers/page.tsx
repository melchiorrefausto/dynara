import Link from "next/link";
import { ArrowRight, Layers3, LockKeyhole, Webhook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PageHero } from "@/components/marketing/page-hero";
import { DeveloperStep } from "@/components/marketing/developer-step";
import { Reveal } from "@/components/marketing/reveal";
import { developerSteps } from "@/lib/content/site";

const principles = [
  {
    icon: Layers3,
    title: "Progressive integration",
    description: "Ship an MVP with local code import, then graduate to the manifest and SDK once you need production control."
  },
  {
    icon: LockKeyhole,
    title: "You own the contract",
    description: "Every surface, action, and token Dynara can touch is explicitly declared by your app — nothing is inferred at runtime."
  },
  {
    icon: Webhook,
    title: "Native actions, not screenshots",
    description: "Generated profiles call real app actions through the SDK, so customization stays in sync with your product logic."
  }
];

export default function DevelopersPage() {
  return (
    <main className="bg-white text-slate-950">
      <SiteHeader active="Developers" />

      <PageHero
        eyebrow="Developers"
        title="Start locally, then integrate natively."
        description="The fastest MVP test is importing a local app folder. The production path is an SDK or API integration where your software publishes its schema, design system, actions, and constraints."
      />

      <section className="pb-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {developerSteps.map((step, index) => (
              <Reveal key={step.title} delay={index * 100}>
                <DeveloperStep {...step} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-slate-50 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-3">
          {principles.map((item, index) => (
            <Reveal key={item.title} delay={index * 100} className="flex gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="py-20">
        <Reveal className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 text-center">
          <h2 className="text-3xl font-bold tracking-normal">Ready to expose your first surface?</h2>
          <Button asChild size="lg">
            <Link href="/signup">
              Start your project
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  );
}
