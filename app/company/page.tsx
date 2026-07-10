import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/marketing/reveal";
import { pricingTiers } from "@/lib/content/site";

export default function CompanyPage() {
  return (
    <main className="bg-white text-slate-950">
      <SiteHeader active="Company" />

      <PageHero
        eyebrow="Company"
        title="Building the interface layer for adaptive software."
        description="Every app has one interface for every user. We think the app itself should decide what's safe to change — and let each user shape the rest."
        primaryCta={{ href: "/signup", label: "Start your project" }}
        secondaryCta={{ href: "/login", label: "Talk to us" }}
      />

      <section className="border-t border-border bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <Badge tone="gray">Roadmap</Badge>
              <h2 className="mt-4 text-4xl font-bold tracking-normal">From prototype to platform.</h2>
              <p className="mt-3 text-muted-foreground">
                Start with local testing, then scale into connected runtime workflows for real software products.
              </p>
            </div>
            <Button asChild>
              <Link href="/pricing">
                See full pricing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {pricingTiers.map((plan, index) => (
              <Reveal key={plan.name} delay={index * 100}>
                <div className="h-full rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="mt-4 text-4xl font-black tracking-normal">{plan.price}</p>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{plan.detail}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
