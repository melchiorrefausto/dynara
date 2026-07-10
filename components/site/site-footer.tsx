import type { Route } from "next";
import Link from "next/link";
import { DynaraLogo } from "@/components/ui/logo";
import { navLinks } from "@/lib/content/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <DynaraLogo />
        <p className="text-sm text-muted-foreground">Dynara turns software structure into adaptive interfaces.</p>
        <div className="flex flex-wrap gap-5 text-sm font-semibold text-slate-600">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href as Route} className="hover:text-slate-950">
              {link.label}
            </Link>
          ))}
          <Link href="/login" className="hover:text-slate-950">
            Sign in
          </Link>
          <Link href="/signup" className="hover:text-slate-950">
            Create account
          </Link>
        </div>
      </div>
    </footer>
  );
}
