import type { Route } from "next";
import Link from "next/link";
import { DynaraLogo } from "@/components/ui/logo";

const footerColumns: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/product", label: "Product" },
      { href: "/platform", label: "Platform" },
      { href: "/use-cases", label: "Use cases" },
      { href: "/pricing", label: "Pricing" }
    ]
  },
  {
    title: "Company",
    links: [
      { href: "/company", label: "Company" },
      { href: "/developers", label: "Developers" }
    ]
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/signup", label: "Create account" }
    ]
  }
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <DynaraLogo />
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
              Dynara turns software structure into adaptive interfaces — one runtime contract, a personal
              workspace for every user.
            </p>
          </div>
          {footerColumns.map((column) => (
            <div key={column.title}>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{column.title}</p>
              <div className="mt-4 flex flex-col gap-3 text-sm font-semibold text-slate-600">
                {column.links.map((link) => (
                  <Link key={link.href} href={link.href as Route} className="hover:text-slate-950">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Dynara. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
