import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PageHero } from "@/components/marketing/page-hero";
import { CubeCluster } from "@/components/marketing/cube-cluster";
import { Reveal } from "@/components/marketing/reveal";
import { pricingTiers } from "@/lib/content/site";

const faqs = [
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
  }
];

export default function PricingPage() {
  return (
    <main className="bg-white text-slate-950">
      <SiteHeader active="Pricing" />

      <PageHero
        eyebrow="Pricing"
        title="Simple pricing for every stage."
        description="Start free with local testing, then scale into a connected runtime as your product and team grow."
      />

      <section className="pb-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {pricingTiers.map((plan, index) => (
              <Reveal key={plan.name} delay={index * 100}>
                <div className="flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold">{plan.name}</h3>
                      <p className="mt-3 text-4xl font-black tracking-normal">{plan.price}</p>
                    </div>
                    <CubeCluster count={plan.cubes} />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{plan.detail}</p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="mt-8 w-full" variant={plan.name === "Team" ? "default" : "secondary"}>
                    <Link href="/signup">
                      {plan.price === "Custom" ? "Talk to us" : "Get started"}
                    </Link>
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-slate-50 py-20">
        <Reveal className="mx-auto max-w-3xl px-6">
          <h2 className="text-3xl font-bold tracking-normal">Frequently asked questions</h2>
          <div className="mt-8 space-y-6">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="py-20">
        <Reveal className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 text-center">
          <h2 className="text-3xl font-bold tracking-normal">Ready to give your users a personal interface?</h2>
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
