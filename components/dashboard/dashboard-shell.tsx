"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Plus,
  Settings,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DynaraLogo } from "@/components/ui/logo";
import { IntegrationBuilder } from "@/components/dashboard/integration-builder";
import {
  appsStorageKey,
  defaultConnectedApps,
  defaultPreferences,
  preferencesStorageKey,
  readJson,
  writeJson,
  type WorkspacePreferences
} from "@/lib/dashboard/workspace-state";
import {
  activeManifestStorageKey,
  createBlankManifest,
  manifestsStorageKey,
  normalizeManifest,
  upsertContentBlocks
} from "@/lib/dashboard/manifest-state";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  loadDashboardState,
  saveConnectedAppToSupabase,
  savePreferencesToSupabase
} from "@/lib/supabase/dashboard-store";
import { deleteManifestFromSupabase, loadManifests, saveManifestToSupabase } from "@/lib/supabase/manifest-store";
import {
  loadPendingContentEditDrafts,
  markContentEditDraftReviewed,
  type ContentEditDraft
} from "@/lib/supabase/content-edit-drafts";
import { getConnector } from "@/lib/connectors/registry";
import type { ConnectorProvider } from "@/lib/connectors/types";
import { cn, initials } from "@/lib/utils";
import type { ConnectedApp } from "@/types/workspace";
import type { IntegrationManifest } from "@/types/manifest";

type DashboardUser = {
  email: string;
  name: string;
};

const mockProjectNames = new Set(["", "crm", "numerix", "numeri", "numer", "nume"]);

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Request timed out.")), ms))
  ]);
}

export function DashboardShell({ view = "home" }: { view?: "home" | "settings" }) {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [manifests, setManifests] = useState<IntegrationManifest[]>([]);
  const [activeManifestId, setActiveManifestId] = useState("");
  const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>(defaultConnectedApps);
  const [preferences, setPreferences] = useState<WorkspacePreferences>(defaultPreferences);
  const [contentEditDrafts, setContentEditDrafts] = useState<ContentEditDraft[]>([]);
  const [persistenceMode, setPersistenceMode] = useState<"local" | "supabase">("local");
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);

  const activeManifest = useMemo(
    () => manifests.find((manifest) => manifest.id === activeManifestId) ?? manifests[0] ?? null,
    [activeManifestId, manifests]
  );

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    async function loadSession() {
      setAuthError(null);
      let dashboardLoadedFromSupabase = false;

      if (!supabase) {
        router.replace("/login");
        return;
      }

      let user;
      try {
        const result = await withTimeout(supabase.auth.getUser(), 8000);
        user = result.data.user;
      } catch {
        if (!cancelled) {
          setAuthError("Could not reach Supabase. The project may be paused or your connection is down.");
        }
        return;
      }

      if (cancelled) return;

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
      const manifestState = await loadManifests(supabase, user);
      const draftState = await loadPendingContentEditDrafts(supabase, user.id);

      if (cancelled) return;

      if (manifestState) {
        const cleanedManifests = filterMockProjects(manifestState);
        setManifests(cleanedManifests);
        setActiveManifestId(cleanedManifests[0]?.id ?? "");

        const removedManifests = manifestState.filter((manifest) => !cleanedManifests.some((item) => item.id === manifest.id));
        if (removedManifests.length > 0) {
          Promise.all(
            removedManifests.map((manifest) => deleteManifestFromSupabase(supabase, user.id, manifest.id))
          ).catch(() => undefined);
        }
      } else {
        const storedManifests = filterMockProjects(
          readJson<Partial<IntegrationManifest>[]>(manifestsStorageKey, []).map(normalizeManifest)
        );
        const storedActiveManifest = readJson<string>(activeManifestStorageKey, "");
        setManifests(storedManifests);
        setActiveManifestId(
          storedManifests.some((manifest) => manifest.id === storedActiveManifest) ? storedActiveManifest : storedManifests[0]?.id ?? ""
        );
      }

      if (dashboardState) {
        setConnectedApps(dashboardState.connectedApps);
        setPreferences(dashboardState.preferences);
        setPersistenceMode("supabase");
        dashboardLoadedFromSupabase = true;
      }

      if (draftState) {
        setContentEditDrafts(draftState);
      }

      if (dashboardLoadedFromSupabase) {
        setAuthReady(true);
        return;
      }

      const enabledAppIds = new Set(defaultConnectedApps.map((app) => app.id));
      const storedApps = readJson<ConnectedApp[]>(appsStorageKey, defaultConnectedApps)
        .filter((app) => enabledAppIds.has(app.id));
      const storedPreferences = readJson<WorkspacePreferences>(preferencesStorageKey, defaultPreferences);

      setConnectedApps(storedApps.length > 0 ? storedApps : defaultConnectedApps);
      setPreferences(storedPreferences);
      setPersistenceMode("local");
      setAuthReady(true);
    }

    loadSession();
    return () => {
      cancelled = true;
    };
  }, [router, retryKey]);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    writeJson(appsStorageKey, connectedApps);
    writeJson(preferencesStorageKey, preferences);
    writeJson(manifestsStorageKey, manifests);
    writeJson(activeManifestStorageKey, activeManifestId);

    if (persistenceMode !== "supabase" || !supabaseUserId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;

      Promise.all([
        ...connectedApps.map((app) => saveConnectedAppToSupabase(supabase, supabaseUserId, app)),
        ...manifests.map((manifest) => saveManifestToSupabase(supabase, supabaseUserId, manifest)),
        savePreferencesToSupabase(supabase, supabaseUserId, preferences)
      ]).catch(() => {
        setPersistenceMode("local");
      });
    }, 600);

    return () => window.clearTimeout(timeoutId);
  }, [activeManifestId, authReady, connectedApps, manifests, persistenceMode, preferences, supabaseUserId]);

  async function logout() {
    const supabase = createSupabaseBrowserClient();

    if (supabase) {
      await supabase.auth.signOut();
    }

    localStorage.removeItem("dynara-session");
    router.replace("/");
  }

  function upsertManifest(manifest: IntegrationManifest) {
    setManifests((current) => {
      const exists = current.some((item) => item.id === manifest.id);
      return exists ? current.map((item) => (item.id === manifest.id ? manifest : item)) : [manifest, ...current];
    });
    setActiveManifestId(manifest.id);
  }

  async function publishContentEditDraft(draft: ContentEditDraft) {
    const manifest = manifests.find((item) => item.id === draft.manifestId);
    if (!manifest) return;

    const nextManifest = upsertContentBlocks(manifest, draft.blocks);
    upsertManifest(nextManifest);
    setContentEditDrafts((current) => current.filter((item) => item.id !== draft.id));

    if (persistenceMode === "supabase" && supabaseUserId) {
      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        await Promise.all([
          saveManifestToSupabase(supabase, supabaseUserId, nextManifest),
          markContentEditDraftReviewed(supabase, draft.id, "approved")
        ]).catch(() => setPersistenceMode("local"));
      }
    }
  }

  async function rejectContentEditDraft(draft: ContentEditDraft) {
    setContentEditDrafts((current) => current.filter((item) => item.id !== draft.id));

    if (persistenceMode === "supabase") {
      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        await markContentEditDraftReviewed(supabase, draft.id, "rejected").catch(() => setPersistenceMode("local"));
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

  function updatePreference<K extends keyof WorkspacePreferences>(key: K, value: WorkspacePreferences[K]) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  const content =
    view === "settings" ? (
      <SettingsPageContent
        connectedApps={connectedApps}
        preferences={preferences}
        user={user}
        onToggleApp={toggleApp}
        onPreferenceChange={updatePreference}
      />
    ) : !activeManifest ? (
      <EmptyProjectsState onCreateProject={() => upsertManifest(createBlankManifest("New Project"))} />
    ) : (
      <IntegrationBuilder
        manifest={activeManifest}
        contentEditDrafts={contentEditDrafts.filter((draft) => draft.manifestId === activeManifest.id)}
        onPublishContentEditDraft={publishContentEditDraft}
        onRejectContentEditDraft={rejectContentEditDraft}
        onUpdateManifest={upsertManifest}
      />
    );

  if (authError) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-lg border border-border bg-white p-6 text-center shadow-sm">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-800">{authError}</p>
          <Button className="mt-4 w-full" variant="dark" onClick={() => setRetryKey((key) => key + 1)}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!authReady || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
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
            activeManifestId={activeManifest?.id ?? ""}
            manifests={manifests}
            view={view}
            onClose={() => setSidebarOpen(false)}
            onCreateManifest={() => {
              upsertManifest(createBlankManifest("New Project"));
              setSidebarOpen(false);
            }}
            onSelectManifest={(id) => {
              setActiveManifestId(id);
              setSidebarOpen(false);
            }}
            onDeleteManifest={(id) => {
              setManifests((current) => {
                const next = current.filter((manifest) => manifest.id !== id);
                if (id === activeManifestId) setActiveManifestId(next[0]?.id ?? "");
                return next;
              });
            }}
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
            workspaceName={activeManifest?.name ?? "Projects"}
            onCreateWorkspace={() => upsertManifest(createBlankManifest("New Project"))}
            onLogout={logout}
            onMenu={() => setSidebarOpen(true)}
            onToggleNotifications={() => setNotificationsOpen((open) => !open)}
            onToggleProfile={() => setProfileOpen((open) => !open)}
          />
          <div className="p-4 lg:p-6">{content}</div>
        </main>
      </div>
    </div>
  );
}

function filterMockProjects(manifests: IntegrationManifest[]) {
  return manifests.filter((manifest) => {
    const candidates = [manifest.name, manifest.slug, manifest.appId].map((value) => value.toLowerCase().trim());
    const isNamedMock = candidates.some((value) => mockProjectNames.has(value));
    return !(isNamedMock && isEmptyProject(manifest));
  });
}

function isEmptyProject(manifest: IntegrationManifest) {
  return (
    manifest.panels.length === 0 &&
    manifest.surfaces.length === 0 &&
    manifest.views.length === 0 &&
    manifest.actions.length === 0 &&
    manifest.designSystem.tokens.length === 0 &&
    manifest.designSystem.componentRefs.length === 0 &&
    manifest.profiles.length === 0
  );
}

function Sidebar({
  activeManifestId,
  manifests,
  view,
  onClose,
  onCreateManifest,
  onDeleteManifest,
  onSelectManifest,
}: {
  activeManifestId: string;
  manifests: IntegrationManifest[];
  view: "home" | "settings";
  onClose: () => void;
  onCreateManifest: () => void;
  onDeleteManifest: (id: string) => void;
  onSelectManifest: (id: string) => void;
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
          <p className="mb-3 text-xs font-bold uppercase tracking-normal text-muted-foreground">Projects</p>
          <div className="space-y-1">
            {manifests.map((manifest) => (
              <div
                key={manifest.id}
                className={cn(
                  "group flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-muted",
                  view === "home" && manifest.id === activeManifestId && "bg-slate-100 text-slate-950 ring-1 ring-slate-200"
                )}
              >
                <Link
                  href="/dashboard"
                  onClick={() => onSelectManifest(manifest.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0 text-slate-500" />
                  <span className="min-w-0 flex-1 truncate">{manifest.name}</span>
                </Link>
                {view === "home" && manifest.id === activeManifestId ? (
                  <span className="h-2 w-2 rounded-full bg-gradient-to-br from-primary via-fuchsia-500 to-cyan-400" />
                ) : null}
                <button
                  aria-label={`Delete ${manifest.name}`}
                  onClick={() => onDeleteManifest(manifest.id)}
                  className="rounded-md p-1 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={onCreateManifest}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-muted-foreground hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
          </div>
        </nav>
      </div>

      <div className="mt-auto space-y-1 border-t border-border pt-4">
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
          <Button size="sm" variant="dark" onClick={onCreateWorkspace}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications" onClick={onToggleNotifications}>
            <Bell className="h-5 w-5" />
          </Button>
          <button
            className="flex items-center gap-2 rounded-full border border-border bg-white p-1.5"
            onClick={onToggleProfile}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-950 text-xs font-bold text-white">
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
                <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-950 text-sm font-bold text-white">
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

function EmptyProjectsState({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-3xl place-items-center px-4">
      <div className="w-full rounded-lg border border-border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-slate-950 text-white">
          <LayoutDashboard className="h-5 w-5" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-normal text-slate-950">Create your first project</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
          Start by creating a software project. From there you can connect code, describe customizable surfaces,
          add actions, and generate the runtime manifest for that product.
        </p>
        <Button className="mt-6" variant="dark" onClick={onCreateProject}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </div>
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
        <Badge tone="gray">Settings</Badge>
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
            <Moon className="h-5 w-5 text-slate-700" />
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
      <span
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1 text-xs",
          checked
            ? "bg-gradient-to-r from-primary/10 via-fuchsia-500/10 to-cyan-400/10 text-primary"
            : "bg-slate-100 text-slate-500"
        )}
      >
        {checked ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
        {checked ? "On" : "Off"}
      </span>
    </button>
  );
}
