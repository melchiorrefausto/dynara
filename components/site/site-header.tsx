import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DynaraLogo } from "@/components/ui/logo";
import { navLinks } from "@/lib/content/site";
import { cn } from "@/lib/utils";

export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="sticky top-4 z-20 px-4">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 rounded-full border border-border bg-white/90 px-5 py-3 shadow-soft backdrop-blur">
        <Link href="/" aria-label="Dynara home">
          <DynaraLogo />
        </Link>
        <div className="hidden items-center gap-1 text-sm font-semibold text-slate-600 xl:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href as Route}
              className={cn(
                "rounded-full px-3.5 py-2 hover:bg-slate-100 hover:text-slate-950",
                active === link.label && "bg-slate-100 text-slate-950"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="secondary" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Create account</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
