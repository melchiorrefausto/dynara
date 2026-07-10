import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PageHero } from "@/components/marketing/page-hero";
import { Feature } from "@/components/marketing/feature";
import { ProductMockup } from "@/components/marketing/product-mockup";
import { Reveal } from "@/components/marketing/reveal";
import { heroFeatures } from "@/lib/content/site";

export default function ProductPage() {
  return (
    <main className="bg-white text-slate-950">
      <SiteHeader active="Product" />

      <PageHero
        eyebrow="Product"
        title="One workspace for every surface of your app."
        description="Dynara turns your app's structure, design system, and safe actions into a workspace where each user can build the interface that fits them."
      />

      <section className="pb-16">
        <Reveal className="mx-auto max-w-6xl px-6">
          <ProductMockup />
        </Reveal>
      </section>

      <section className="border-t border-border bg-slate-50 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-3">
          {heroFeatures.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 100}>
              <Feature icon={feature.icon} title={feature.title}>
                {feature.description}
              </Feature>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="py-20">
        <Reveal className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 text-center">
          <h2 className="text-3xl font-bold tracking-normal">See it running on your own app.</h2>
          <p className="max-w-xl text-muted-foreground">
            Import a local project or connect your design system to generate the first workspace in minutes.
          </p>
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
