"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
  Eye,
  Home,
  Pin,
  Plus,
  ShieldCheck,
  Sparkles,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const themes = [
  { name: "Ocean", colors: ["#0d9488", "#0f766e", "#ecfeff"], accent: "#0d9488", soft: "#ccfbf1" },
  { name: "Mono compact", colors: ["#0f172a", "#475569", "#f1f5f9"], accent: "#0f172a", soft: "#e2e8f0" },
  { name: "Sunset spacious", colors: ["#ef4444", "#f97316", "#fde68a"], accent: "#ea580c", soft: "#ffedd5" }
];

const modes = [
  { name: "Content focus", density: "comfortable" },
  { name: "Reading mode", density: "spacious" },
  { name: "Hero showcase", density: "spacious" },
  { name: "Hero compact", density: "compact" },
  { name: "Full interface", density: "comfortable" }
];

const views = ["Default", "Focus content", "Hero focus", "Tool discovery", "Reading", "Minimal"];
const surfaces = ["Navigation", "Hero", "Hero Search", "Tool Categories"];

export function ProductMockup() {
  const [themeIndex, setThemeIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setThemeIndex((current) => (current + 1) % themes.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const theme = themes[themeIndex];

  return (
    <div className="glass-panel overflow-hidden rounded-2xl">
      <div className="grid lg:grid-cols-[1fr_320px]">
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Home className="h-4 w-4 text-slate-400" />
              BeFour
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="dark">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
              <Bell className="h-4 w-4 text-slate-400" />
              <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-950 text-xs font-bold text-white">
                FM
              </span>
            </div>
          </div>

          <Badge tone="blue">Integrate Dynara</Badge>
          <h3 className="mt-4 text-2xl font-bold">Make BeFour customizable</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Describe the surfaces, actions, design tokens, and safety constraints your product exposes to Dynara. The
            extension can apply user-specific profiles while the host software keeps control over what&apos;s safe.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
            <span className="text-fuchsia-600">See a worked example ↗</span>
            <span className="text-primary">Read the integration guide ↗</span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            {[
              ["4", "Surfaces"],
              ["0", "Actions"],
              ["0", "Mutable tokens"],
              ["0", "Profiles"]
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-border bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
                <p
                  className="mt-1 text-2xl font-bold transition-colors duration-700"
                  style={{ color: value === "4" ? theme.accent : undefined }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside className="animate-panel-in border-l border-border bg-white/85 p-4 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold leading-tight">Dynara</p>
                <p className="text-[11px] leading-tight text-muted-foreground">interface runtime</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Pin className="h-3.5 w-3.5" />
              <X className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-3 text-[11px] font-semibold text-muted-foreground">Detected via dynara.json</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button size="sm" className="w-full">
              Save current
            </Button>
            <Button size="sm" variant="secondary" className="w-full">
              Auto off
            </Button>
          </div>

          <div className="mt-4 rounded-xl bg-emerald-50 p-3">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <ShieldCheck className="h-3.5 w-3.5" />
                WCAG contrast
              </p>
              <span className="text-xs font-bold text-emerald-700">AA pass (6/6)</span>
            </div>
            <p className="mt-1 text-[11px] leading-4 text-emerald-700">
              Declared foreground/background pairs pass WCAG AA.
            </p>
          </div>

          <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Themes</p>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((t, index) => (
              <div
                key={t.name}
                className={cn(
                  "rounded-lg border p-2 transition-all duration-500",
                  index === themeIndex ? "border-primary ring-2 ring-primary" : "border-border"
                )}
              >
                <div className="flex gap-1">
                  {t.colors.map((c) => (
                    <span key={c} className="h-3 w-3 rounded-full" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <p className="mt-1.5 text-[10px] font-bold leading-tight">{t.name}</p>
              </div>
            ))}
          </div>

          <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Modes</p>
          <div className="grid grid-cols-2 gap-2">
            {modes.map((mode) => (
              <div key={mode.name} className="rounded-lg border border-border p-2">
                <p className="text-[11px] font-bold leading-tight">{mode.name}</p>
                <p className="text-[10px] text-muted-foreground">{mode.density}</p>
              </div>
            ))}
          </div>

          <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Views</p>
          <div className="flex flex-wrap gap-1.5">
            {views.map((view, index) => (
              <span
                key={view}
                className={cn(
                  "rounded-full border px-2 py-1 text-[10px] font-semibold",
                  index === 0 ? "border-primary bg-primary/10 text-primary" : "border-border text-slate-500"
                )}
              >
                {view}
              </span>
            ))}
          </div>

          <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Surfaces</p>
          <div className="space-y-1.5">
            {surfaces.map((surface) => (
              <div key={surface} className="flex items-center justify-between rounded-lg border border-border px-2.5 py-1.5">
                <span className="text-[11px] font-semibold">{surface}</span>
                <span className="flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                  <Eye className="h-2.5 w-2.5" />
                  Hide
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
