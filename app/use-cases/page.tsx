import Link from "next/link";
import { ArrowRight, Compass, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/marketing/reveal";
import { useCases } from "@/lib/content/site";

const extraUseCases = [
  {
    icon: GraduationCap,
    title: "Onboarding flows",
    description: "Generate a guided first-run profile that surfaces only the setup steps a new user needs."
  },
  {
    icon: Compass,
    title: "Sales enablement views",
    description: "Build a demo-ready profile that hides internal tooling and highlights the workflow a prospect cares about."
  }
];

const allUseCases = [...useCases, ...extraUseCases];

export default function UseCasesPage() {
  return (
    <main className="bg-white text-slate-950">
      <SiteHeader active="Use cases" />

      <PageHero
        eyebrow="Use cases"
        title="Personal workspaces for complex software."
        description="From design systems to support consoles, teams use Dynara to give every user a workspace scoped to their role."
      />

      <section className="pb-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {allUseCases.map((useCase, index) => (
              <Reveal key={useCase.title} delay={index * 80}>
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

      <section className="border-t border-border bg-slate-50 py-20">
        <Reveal className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 text-center">
          <h2 className="text-3xl font-bold tracking-normal">Have a use case we haven&apos;t covered?</h2>
          <p className="max-w-xl text-muted-foreground">
            Import your app&apos;s structure and generate a workspace tailored to your own role and task.
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
