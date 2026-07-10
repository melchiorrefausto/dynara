import {
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronDown,
  Circle,
  Figma,
  GitBranch,
  Headphones,
  LayoutGrid,
  MessageSquare,
  Settings,
  Slack,
  Sparkles,
  StickyNote,
  Workflow
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const sidebarProjects = [
  { icon: LayoutGrid, label: "Design System Workspace" },
  { icon: Boxes, label: "Internal CRM" },
  { icon: BarChart3, label: "Analytics Suite" },
  { icon: Headphones, label: "Support Console" },
  { icon: Settings, label: "Admin Workspace" }
];

const connectedApps = [
  { icon: Figma, label: "Figma", status: "Connected" },
  { icon: StickyNote, label: "Notion", status: null },
  { icon: GitBranch, label: "Linear", status: null },
  { icon: Slack, label: "Slack", status: null }
];

const recentActivity = [
  { text: "New token set added", time: "2m ago" },
  { text: "Profile “Developer Handoff” updated", time: "1h ago" },
  { text: "Component “Button / Primary” modified", time: "3h ago" }
];

const profileChecklist = [
  { label: "Keep canvas visible", checked: true },
  { label: "Hide advanced inspector", checked: true },
  { label: "Pin comment action", checked: false }
];

export function ProductMockup() {
  return (
    <div className="glass-panel overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <LayoutGrid className="h-4 w-4 text-primary" />
          Design System Workspace
          <ChevronDown className="h-4 w-4 text-slate-400" />
          <span className="ml-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Synced 2m ago
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary">Import code</Button>
          <Button size="sm" variant="secondary">Export schema</Button>
          <Button size="sm">Generate profile</Button>
        </div>
      </div>
      <div className="grid min-h-[420px] lg:grid-cols-[240px_1fr_290px]">
        <aside className="hidden border-r border-border bg-white/62 p-5 lg:block">
          <p className="mb-3 text-xs font-bold uppercase tracking-normal text-muted-foreground">Projects</p>
          {sidebarProjects.map((item, index) => (
            <div
              key={item.label}
              className={`mb-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                index === 0 ? "bg-primary/10 text-primary" : "text-slate-600"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </div>
          ))}

          <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-normal text-muted-foreground">
            Connected apps
          </p>
          {connectedApps.map((app) => (
            <div key={app.label} className="mb-1 flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600">
              <span className="flex items-center gap-2.5">
                <app.icon className="h-4 w-4" />
                {app.label}
              </span>
              {app.status ? <span className="text-xs font-bold text-success">{app.status}</span> : null}
            </div>
          ))}
          <Button size="sm" variant="secondary" className="mt-4 w-full">
            Manage integrations
          </Button>
        </aside>
        <div className="p-6">
          <h3 className="text-2xl font-bold">Design System Workspace</h3>
          <p className="mt-2 text-sm text-muted-foreground">Expose surfaces, actions, and profiles for one software product.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            {[
              ["12", "Surfaces"],
              ["7", "Actions"],
              ["28", "Tokens"],
              ["4", "Profiles"]
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-border bg-white p-4">
                <p className="text-2xl font-bold text-slate-950">{value}</p>
                <p className="text-sm font-semibold text-slate-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            {["Sidebar", "Canvas", "Inspector", "Comments"].map((item, index) => (
              <div key={item} className="rounded-xl border border-border bg-white p-4">
                <div
                  className={`mb-5 grid h-14 place-items-center rounded-xl ${
                    index === 0 ? "bg-primary/10" : "bg-slate-50"
                  }`}
                >
                  <Workflow className={`h-6 w-6 ${index === 0 ? "text-primary" : "text-slate-400"}`} />
                </div>
                <p className="text-sm font-bold">{item}</p>
                <p className="mt-1 text-xs text-muted-foreground">{index === 1 ? "Required" : "Customizable"}</p>
              </div>
            ))}
          </div>

          <p className="mb-3 mt-8 text-sm font-bold">Recent activity</p>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.text} className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3">
                <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {activity.text}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                  <span className="h-6 w-6 rounded-full bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <aside className="border-l border-border bg-white/72 p-5">
          <p className="text-sm font-bold">Generate a user profile</p>
          <div className="mt-4 rounded-xl border border-border bg-white p-3 text-sm leading-6 text-slate-600">
            Make this interface simpler for a beginner who only needs layout editing and comments.
            <Button className="mt-3 h-9 w-9 p-0" aria-label="Send prompt">
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
          <Badge tone="gray" className="mt-4 border border-border bg-white text-slate-600">
            <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
            Profile draft
          </Badge>
          <div className="mt-5 space-y-3 text-sm font-semibold text-slate-700">
            {profileChecklist.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                {item.checked ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-300" />
                )}
                {item.label}
              </div>
            ))}
          </div>
          <Button variant="secondary" className="mt-6 w-full">
            Preview profile
            <ArrowRight className="h-4 w-4" />
          </Button>
        </aside>
      </div>
    </div>
  );
}
