import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DynaraLogo } from "@/components/ui/logo";
import { navLinks } from "@/lib/content/site";
import { cn } from "@/lib/utils";

export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" aria-label="Dynara home">
          <DynaraLogo />
        </Link>
        <div className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href as Route}
              className={cn("hover:text-slate-950", active === link.label && "text-slate-950")}
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
