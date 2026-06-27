"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Figma,
  FileCode2,
  Home,
  Import,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Plus,
  Settings,
  Slack,
  Sparkles,
  UploadCloud,
  UserRound,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DynaraLogo } from "@/components/ui/logo";
import { WorkspaceBuilder } from "@/components/dashboard/workspace-builder";
import {
  activeWorkspaceStorageKey,
  appsStorageKey,
  defaultConnectedApps,
  defaultPreferences,
  createBlankWorkspace,
  initialWorkspaces,
  preferencesStorageKey,
  readJson,
  workspacesStorageKey,
  writeJson,
  type WorkspacePreferences
} from "@/lib/dashboard/workspace-state";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  deleteWorkspaceFromSupabase,
  loadDashboardState,
  saveConnectedAppToSupabase,
  savePreferencesToSupabase,
  saveWorkspaceToSupabase
} from "@/lib/supabase/dashboard-store";
import { getConnector } from "@/lib/connectors/registry";
import type { ConnectorProvider } from "@/lib/connectors/types";
import { cn, initials } from "@/lib/utils";
import type { ConnectedApp, WorkspaceSchema } from "@/types/workspace";

type DashboardUser = {
  email: string;
  name: string;
};

const appIcons = {
  figma: Figma,
  notion: FileCode2,
  linear: LayoutDashboard,
  gmail: UploadCloud,
  slack: Slack
};

export function DashboardShell({ settings = false }: { settings?: boolean }) {
  const router = useRouter();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSchema[]>(initialWorkspaces);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
  const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>(defaultConnectedApps);
  const [preferences, setPreferences] = useState<WorkspacePreferences>(defaultPreferences);
  const [persistenceMode, setPersistenceMode] = useState<"local" | "supabase">("local");
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0],
    [activeWorkspaceId, workspaces]
  );

  const activeApp = connectedApps.find((app) => app.status === "connected") ?? connectedApps[0];

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function loadSession() {
      let dashboardLoadedFromSupabase = false;

      if (!supabase) {
        router.replace("/login");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const metadata = user.user_metadata;
      setSupabaseUserId(user.id);
      setUser({
        email: user.email ?? "user@dynara.ai",
        name: typeof metadata?.name === "string" ? metadata.name : user.email ?? "Dynara User"
      });

      const dashboardState = await loadDashboardState(supabase, user);

      if (dashboardState) {
        setWorkspaces(dashboardState.workspaces);
        setConnectedApps(dashboardState.connectedApps);
        setPreferences(dashboardState.preferences);
        setActiveWorkspaceId(dashboardState.workspaces[0]?.id ?? "");
        setPersistenceMode("supabase");
        dashboardLoadedFromSupabase = true;
      }

      if (dashboardLoadedFromSupabase) {
        setAuthReady(true);
        return;
      }

      const storedWorkspaces = readJson<WorkspaceSchema[]>(workspacesStorageKey, []);
      const storedApps = readJson<ConnectedApp[]>(appsStorageKey, defaultConnectedApps);
      const storedPreferences = readJson<WorkspacePreferences>(preferencesStorageKey, defaultPreferences);
      const storedActive = readJson<string>(activeWorkspaceStorageKey, "");

      setWorkspaces(storedWorkspaces);
      setConnectedApps(storedApps);
      setPreferences(storedPreferences);
      setActiveWorkspaceId(storedWorkspaces.some((workspace) => workspace.id === storedActive) ? storedActive : storedWorkspaces[0]?.id ?? "");
      setPersistenceMode("local");
      setAuthReady(true);
    }

    loadSession();
  }, [router]);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    writeJson(workspacesStorageKey, workspaces);
    writeJson(activeWorkspaceStorageKey, activeWorkspaceId);
    writeJson(appsStorageKey, connectedApps);
    writeJson(preferencesStorageKey, preferences);

    if (persistenceMode === "supabase" && supabaseUserId) {
      const supabase = createSupabaseBrowserClient();

      if (supabase) {
        Promise.all([
          ...workspaces.map((workspace) => saveWorkspaceToSupabase(supabase, supabaseUserId, workspace)),
          ...connectedApps.map((app) => saveConnectedAppToSupabase(supabase, supabaseUserId, app)),
          savePreferencesToSupabase(supabase, supabaseUserId, preferences)
        ]).catch(() => {
          setPersistenceMode("local");
        });
      }
    }
  }, [activeWorkspaceId, authReady, connectedApps, persistenceMode, preferences, supabaseUserId, workspaces]);

  async function logout() {
    const supabase = createSupabaseBrowserClient();

    if (supabase) {
      await supabase.auth.signOut();
    }

    localStorage.removeItem("dynara-session");
    router.replace("/login");
  }

  function upsertWorkspace(workspace: WorkspaceSchema, activate = true) {
    setWorkspaces((current) => {
      const exists = current.some((item) => item.id === workspace.id);
      return exists ? current.map((item) => (item.id === workspace.id ? workspace : item)) : [workspace, ...current];
    });

    if (activate) {
      setActiveWorkspaceId(workspace.id);
    }
  }

  function createWorkspace() {
    upsertWorkspace(createBlankWorkspace());
    setSidebarOpen(false);
  }

  function deleteWorkspace(workspaceId: string) {
    setWorkspaces((current) => {
      const next = current.filter((workspace) => workspace.id !== workspaceId);

      if (workspaceId === activeWorkspaceId) {
        setActiveWorkspaceId(next[0]?.id ?? "");
      }

      return next;
    });

    if (persistenceMode === "supabase" && supabaseUserId) {
      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        deleteWorkspaceFromSupabase(supabase, supabaseUserId, workspaceId).catch(() => setPersistenceMode("local"));
      }
    }
  }

  async function toggleApp(appId: string) {
    const currentApp = connectedApps.find((app) => app.id === appId);
    if (!currentApp) {
      return;
    }

    if (appId === "figma") {
      const sessionToken = await getSupabaseAccessToken();

      if (!sessionToken) {
        window.alert("Sign in with Supabase before connecting Figma.");
        return;
      }

      if (currentApp.status === "connected") {
        const response = await fetch("/api/connectors/figma/disconnect", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionToken}`
          }
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          window.alert(payload.error ?? "Could not disconnect Figma.");
          return;
        }

        const nextApp: ConnectedApp = {
          id: "figma",
          name: currentApp.name,
          status: "available"
        };
        setConnectedApps((current) => current.map((app) => (app.id === appId ? nextApp : app)));
        return;
      }

      const response = await fetch("/api/connectors/figma/start", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`
        }
      });
      const payload = (await response.json().catch(() => ({}))) as { authUrl?: string; error?: string };

      if (!response.ok || !payload.authUrl) {
        window.alert(payload.error ?? "Could not start Figma OAuth.");
        return;
      }

      window.location.href = payload.authUrl;
      return;
    }

    const connector = getConnector(appId as ConnectorProvider);
    const connection =
      currentApp.status === "connected" ? await connector.disconnect() : await connector.connect();

    const nextApp: ConnectedApp = {
      id: appId,
      name: currentApp.name,
      status: connection.status,
      lastSync: connection.lastSync
    };

    setConnectedApps((current) => current.map((app) => (app.id === appId ? nextApp : app)));

    if (persistenceMode === "supabase" && supabaseUserId) {
      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        saveConnectedAppToSupabase(supabase, supabaseUserId, nextApp).catch(() => setPersistenceMode("local"));
      }
    }
  }

  async function getSupabaseAccessToken() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  function selectApp(appId: string) {
    setSelectedAppId(appId);
    setSidebarOpen(false);
  }

  function updatePreference<K extends keyof WorkspacePreferences>(key: K, value: WorkspacePreferences[K]) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  function exportAllWorkspaces() {
    const blob = new Blob([JSON.stringify({ workspaces, connectedApps, preferences }, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "dynara-dashboard-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importWorkspaces(file: File) {
    const text = await file.text();
    const payload = JSON.parse(text) as { workspaces?: WorkspaceSchema[] };

    if (Array.isArray(payload.workspaces) && payload.workspaces.length > 0) {
      setWorkspaces(payload.workspaces);
      setActiveWorkspaceId(payload.workspaces[0].id);
    }
  }

  const content = settings ? (
    <SettingsPageContent
      connectedApps={connectedApps}
      preferences={preferences}
      user={user}
      onToggleApp={toggleApp}
      onPreferenceChange={updatePreference}
    />
  ) : (
    <WorkspaceBuilder
      activeApp={activeApp}
      activeWorkspace={activeWorkspace}
      connectedApps={connectedApps}
      preferences={preferences}
      workspaces={workspaces}
      onCreateWorkspace={createWorkspace}
      onSelectWorkspace={setActiveWorkspaceId}
      onUpdateWorkspace={(workspace) => upsertWorkspace(workspace, false)}
      onUpsertWorkspace={upsertWorkspace}
      selectedApp={connectedApps.find((app) => app.id === selectedAppId)}
      onSelectApp={selectApp}
      onToggleApp={toggleApp}
      onDeleteWorkspace={deleteWorkspace}
    />
  );

  if (!authReady || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          Loading Dynara...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-[310px] -translate-x-full border-r border-border bg-white/95 p-4 shadow-soft backdrop-blur transition lg:static lg:translate-x-0 lg:shadow-none",
            sidebarOpen && "translate-x-0"
          )}
        >
          <Sidebar
            activeWorkspaceId={activeWorkspaceId}
            connectedApps={connectedApps}
            workspaces={workspaces}
            onClose={() => setSidebarOpen(false)}
            onCreateWorkspace={createWorkspace}
            onSelectWorkspace={(id) => {
              setActiveWorkspaceId(id);
              setSidebarOpen(false);
            }}
            onDeleteWorkspace={deleteWorkspace}
            onSelectApp={selectApp}
          />
        </aside>

        {sidebarOpen ? (
          <button
            aria-label="Close navigation"
            className="fixed inset-0 z-30 bg-slate-950/20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        <main className="min-w-0 flex-1">
          <TopBar
            notificationsOpen={notificationsOpen}
            profileOpen={profileOpen}
            user={user}
            workspaceName={activeWorkspace?.name ?? "No workspace selected"}
            onCreateWorkspace={createWorkspace}
            onExport={exportAllWorkspaces}
            onImportClick={() => importInputRef.current?.click()}
            onLogout={logout}
            onMenu={() => setSidebarOpen(true)}
            onToggleNotifications={() => setNotificationsOpen((open) => !open)}
            onToggleProfile={() => setProfileOpen((open) => !open)}
          />
          <input
            ref={importInputRef}
            className="hidden"
            type="file"
            accept="application/json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                importWorkspaces(file);
              }
              event.currentTarget.value = "";
            }}
          />
          <div className="p-4 lg:p-6">{content}</div>
        </main>
      </div>
    </div>
  );
}

function Sidebar({
  activeWorkspaceId,
  connectedApps,
  workspaces,
  onClose,
  onCreateWorkspace,
  onDeleteWorkspace,
  onSelectApp,
  onSelectWorkspace,
}: {
  activeWorkspaceId: string;
  connectedApps: ConnectedApp[];
  workspaces: WorkspaceSchema[];
  onClose: () => void;
  onCreateWorkspace: () => void;
  onDeleteWorkspace: (id: string) => void;
  onSelectApp: (id: string) => void;
  onSelectWorkspace: (id: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <DynaraLogo />
        </Link>
        <button className="lg:hidden" onClick={onClose} aria-label="Close navigation">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-6 overflow-y-auto pr-1">
        <nav>
          <p className="mb-3 text-xs font-bold uppercase tracking-normal text-muted-foreground">Workspaces</p>
          <div className="space-y-1">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className={cn(
                  "group flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-muted",
                  workspace.id === activeWorkspaceId && "bg-primary/10 text-slate-950 ring-1 ring-primary/15"
                )}
              >
                <button
                  onClick={() => onSelectWorkspace(workspace.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                </button>
                {workspace.id === activeWorkspaceId ? <span className="h-2 w-2 rounded-full bg-emerald-500" /> : null}
                <button
                  aria-label={`Delete ${workspace.name}`}
                  onClick={() => onDeleteWorkspace(workspace.id)}
                  className="rounded-md p-1 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={onCreateWorkspace}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-muted-foreground hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
              New Workspace
            </button>
          </div>
        </nav>

        <nav>
          <p className="mb-3 text-xs font-bold uppercase tracking-normal text-muted-foreground">Connected Apps</p>
          <div className="space-y-1">
            {connectedApps.map((app) => {
              const Icon = appIcons[app.id as keyof typeof appIcons] ?? LayoutDashboard;
              const connected = app.status === "connected";
              return (
                <button
                  key={app.id}
                  onClick={() => onSelectApp(app.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-muted"
                >
                  <Icon className="h-4 w-4 text-slate-500" />
                  <span className="flex-1">{app.name}</span>
                  <span className={cn("h-2 w-2 rounded-full", connected ? "bg-emerald-500" : "bg-slate-300")} />
                </button>
              );
            })}
          </div>
        </nav>

      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
        <Link href="/dashboard/settings" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </div>
  );
}

function TopBar({
  notificationsOpen,
  profileOpen,
  user,
  workspaceName,
  onCreateWorkspace,
  onExport,
  onImportClick,
  onLogout,
  onMenu,
  onToggleNotifications,
  onToggleProfile
}: {
  notificationsOpen: boolean;
  profileOpen: boolean;
  user: DashboardUser;
  workspaceName: string;
  onCreateWorkspace: () => void;
  onExport: () => void;
  onImportClick: () => void;
  onLogout: () => void;
  onMenu: () => void;
  onToggleNotifications: () => void;
  onToggleProfile: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/80 backdrop-blur">
      <div className="flex h-20 items-center justify-between gap-3 px-4 lg:px-6">
        <button className="lg:hidden" onClick={onMenu} aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden min-w-0 items-center gap-2 text-sm font-semibold text-muted-foreground md:flex">
          <Home className="h-4 w-4 shrink-0" />
          <span className="truncate">{workspaceName}</span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </div>

        <div className="relative ml-auto flex items-center gap-2">
          <Button size="sm" onClick={onCreateWorkspace}>
            <Plus className="h-4 w-4" />
            New Workspace
          </Button>
          <Button variant="secondary" size="sm" className="hidden sm:inline-flex" onClick={onImportClick}>
            <Import className="h-4 w-4" />
            Import
          </Button>
          <Button variant="secondary" size="sm" className="hidden sm:inline-flex" onClick={onExport}>
            Export
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications" onClick={onToggleNotifications}>
            <Bell className="h-5 w-5" />
          </Button>
          <button
            className="flex items-center gap-2 rounded-full border border-border bg-white p-1.5"
            onClick={onToggleProfile}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-slate-900 to-primary text-xs font-bold text-white">
              {initials(user.name)}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {notificationsOpen ? (
            <div className="absolute right-12 top-14 w-80 rounded-lg border border-border bg-white p-4 shadow-soft">
              <p className="text-sm font-bold">Notifications</p>
              <div className="mt-3 space-y-3 text-sm text-slate-600">
                <div className="rounded-lg bg-slate-50 p-3">Workspace actions and imports will appear here.</div>
                <div className="rounded-lg bg-slate-50 p-3">Connected apps sync locally in this MVP.</div>
              </div>
            </div>
          ) : null}

          {profileOpen ? (
            <div className="absolute right-0 top-14 w-72 rounded-lg border border-border bg-white p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-bold text-white">
                  {initials(user.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Button className="mt-4 w-full justify-start" variant="secondary" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function SettingsPageContent({
  connectedApps,
  preferences,
  user,
  onPreferenceChange,
  onToggleApp
}: {
  connectedApps: ConnectedApp[];
  preferences: WorkspacePreferences;
  user: DashboardUser | null;
  onPreferenceChange: <K extends keyof WorkspacePreferences>(key: K, value: WorkspacePreferences[K]) => void;
  onToggleApp: (id: string) => void;
}) {
  return (
    <div className="mx-auto max-w-6xl space-y-5 rounded-lg border border-border bg-white p-6 shadow-sm">
      <div>
        <Badge tone="purple">Settings</Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-normal">Workspace preferences</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Manage connected apps, account defaults, API keys, and workspace behavior for your Dynara runtime.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-border p-5">
          <h2 className="text-sm font-bold uppercase tracking-normal text-slate-800">Connected apps</h2>
          <div className="mt-4 space-y-3">
            {connectedApps.map((app) => (
              <button
                key={app.id}
                onClick={() => onToggleApp(app.id)}
                className="flex w-full items-center justify-between rounded-lg bg-slate-50 p-3 text-left text-sm font-semibold text-slate-700"
              >
                <span>{app.name}</span>
                <Badge tone={app.status === "connected" ? "green" : "gray"}>
                  {app.status === "connected" ? "Connected" : "Connect"}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border p-5">
          <h2 className="text-sm font-bold uppercase tracking-normal text-slate-800">Workspace preferences</h2>
          <div className="mt-4 space-y-3">
            <PreferenceToggle
              checked={preferences.autoSaveGenerated}
              label="Auto-save generated workspaces"
              onChange={() => onPreferenceChange("autoSaveGenerated", !preferences.autoSaveGenerated)}
            />
            <PreferenceToggle
              checked={preferences.showSuggestions}
              label="Show AI suggestions"
              onChange={() => onPreferenceChange("showSuggestions", !preferences.showSuggestions)}
            />
          </div>
        </div>

        <div className="rounded-lg border border-border p-5">
          <h2 className="text-sm font-bold uppercase tracking-normal text-slate-800">API keys</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-lg bg-slate-50 p-3">Supabase URL and anon key loaded from `.env.local`.</div>
            <div className="rounded-lg bg-slate-50 p-3">OpenAI/Anthropic keys can be added server-side for generation.</div>
          </div>
        </div>

        <div className="rounded-lg border border-border p-5">
          <h2 className="text-sm font-bold uppercase tracking-normal text-slate-800">Account settings</h2>
          <div className="mt-4 space-y-3 text-sm font-semibold text-slate-700">
            <div className="rounded-lg bg-slate-50 p-3">{user?.email ?? "No user loaded"}</div>
            <div className="rounded-lg bg-slate-50 p-3">Role: Workspace admin</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-white shadow-sm">
            <Moon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold">Theme</p>
            <p className="text-sm text-muted-foreground">The dashboard is optimized for light mode today.</p>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => onPreferenceChange("theme", preferences.theme === "light" ? "dark" : "light")}
        >
          {preferences.theme === "light" ? "Light" : "Dark"}
        </Button>
      </div>
    </div>
  );
}

function PreferenceToggle({
  checked,
  label,
  onChange
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className="flex w-full items-center justify-between rounded-lg bg-slate-50 p-3 text-left text-sm font-semibold text-slate-700"
    >
      <span>{label}</span>
      <span className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-xs", checked ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
        {checked ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
        {checked ? "On" : "Off"}
      </span>
    </button>
  );
}
