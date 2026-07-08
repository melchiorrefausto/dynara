import type { SupabaseClient, User } from "@supabase/supabase-js";
import { defaultConnectedApps, defaultPreferences, type WorkspacePreferences } from "@/lib/dashboard/workspace-state";
import type { ConnectedApp } from "@/types/workspace";

type ConnectedAppRow = {
  provider: string;
  name: string;
  status: ConnectedApp["status"];
  last_sync_at: string | null;
};

type ProfileRow = {
  preferences: WorkspacePreferences | null;
};

export type DashboardState = {
  connectedApps: ConnectedApp[];
  preferences: WorkspacePreferences;
};

export async function loadDashboardState(supabase: SupabaseClient, user: User): Promise<DashboardState | null> {
  let profileResult = await supabase
    .from("profiles")
    .select("preferences")
    .eq("user_id", user.id)
    .maybeSingle<ProfileRow>();

  if (profileResult.error) {
    return null;
  }

  if (!profileResult.data) {
    profileResult = await supabase
      .from("profiles")
      .insert({
        user_id: user.id,
        email: user.email,
        name: getUserName(user),
        preferences: defaultPreferences
      })
      .select("preferences")
      .single<ProfileRow>();

    if (profileResult.error) {
      return null;
    }
  }

  const appResult = await supabase
    .from("connected_apps")
    .select("provider,name,status,last_sync_at")
    .order("created_at", { ascending: true })
    .returns<ConnectedAppRow[]>();

  if (appResult.error) {
    return null;
  }

  return {
    connectedApps: mergeConnectedApps(appResult.data ?? []),
    preferences: profileResult.data?.preferences ?? defaultPreferences
  };
}

export async function saveConnectedAppToSupabase(supabase: SupabaseClient, userId: string, app: ConnectedApp) {
  return supabase.from("connected_apps").upsert(
    {
      id: `${userId}:${app.id}`,
      user_id: userId,
      provider: app.id,
      name: app.name,
      status: app.status,
      last_sync_at: app.lastSync ? new Date().toISOString() : null
    },
    { onConflict: "user_id,provider" }
  );
}

export async function savePreferencesToSupabase(
  supabase: SupabaseClient,
  userId: string,
  preferences: WorkspacePreferences
) {
  return supabase.from("profiles").update({ preferences }).eq("user_id", userId);
}

function mergeConnectedApps(rows: ConnectedAppRow[]): ConnectedApp[] {
  return defaultConnectedApps.map((app) => {
    const row = rows.find((candidate) => candidate.provider === app.id);

    if (!row) {
      return app;
    }

    return {
      id: app.id,
      name: row.name,
      status: row.status,
      lastSync: row.last_sync_at ? "synced" : undefined
    };
  });
}

function getUserName(user: User) {
  const name = user.user_metadata?.name;
  return typeof name === "string" ? name : user.email ?? "Dynara User";
}
