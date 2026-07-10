import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/marketing/reveal";
import { platform } from "@/lib/content/site";

const safetyGuarantees = [
  "Required navigation and permissions can never be hidden or removed",
  "Every generated action maps to an app-approved capability, not a guess",
  "Design tokens and constraints come from your own schema, not inference",
  "Profiles are versioned and auditable, so changes are always traceable"
];

export default function PlatformPage() {
  return (
    <main className="bg-white text-slate-950">
      <SiteHeader active="Platform" />

      <PageHero
        eyebrow="Platform"
        title="One runtime contract for customizable software."
        description="Dynara reads your app's structure through a single contract — surfaces, actions, tokens, and constraints — then keeps every generated interface inside it."
      />

      <section className="pb-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
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

      <section className="border-t border-border bg-slate-50 py-20">
        <Reveal className="mx-auto max-w-3xl px-6">
          <h2 className="text-3xl font-bold tracking-normal">The safety contract</h2>
          <p className="mt-4 text-muted-foreground">
            Customization only ever happens inside the boundaries your app defines. Dynara can&apos;t invent a
            surface, action, or token that wasn&apos;t explicitly published.
          </p>
          <ul className="mt-8 space-y-4">
            {safetyGuarantees.map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section className="py-20">
        <Reveal className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 text-center">
          <h2 className="text-3xl font-bold tracking-normal">Publish your contract in minutes.</h2>
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
