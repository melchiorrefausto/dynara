import type { Route } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

export function PageHero({
  eyebrow,
  title,
  description,
  primaryCta = { href: "/signup", label: "Start your project" },
  secondaryCta = { href: "/login", label: "Open workspace" }
}: {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  primaryCta?: { href: string; label: string } | null;
  secondaryCta?: { href: string; label: string } | null;
}) {
  return (
    <Reveal className="mx-auto max-w-4xl px-6 pb-14 pt-16 text-center lg:pb-20 lg:pt-24">
      <Badge tone="gray" className="border border-border bg-white text-slate-600">
        {eyebrow}
      </Badge>
      <h1 className="mt-8 text-balance text-5xl font-black tracking-normal text-slate-950 md:text-6xl">
        {title}
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-slate-600">{description}</p>
      {primaryCta || secondaryCta ? (
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {primaryCta ? (
            <Button asChild size="lg">
              <Link href={primaryCta.href as Route}>
                {primaryCta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
          {secondaryCta ? (
            <Button asChild size="lg" variant="secondary">
              <Link href={secondaryCta.href as Route}>{secondaryCta.label}</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </Reveal>
  );
}
