import type { SupabaseClient, User } from "@supabase/supabase-js";
import { normalizeManifest } from "@/lib/dashboard/manifest-state";
import type { IntegrationManifest } from "@/types/manifest";

type ManifestRow = {
  id: string;
  slug: string;
  name: string;
  color: string;
  app_id?: string | null;
  version?: string | null;
  panels: IntegrationManifest["panels"];
  surfaces?: IntegrationManifest["surfaces"] | null;
  views: IntegrationManifest["views"];
  actions: IntegrationManifest["actions"];
  design_system?: IntegrationManifest["designSystem"] | null;
  constraints?: IntegrationManifest["constraints"] | null;
  profiles?: IntegrationManifest["profiles"] | null;
  content_blocks?: IntegrationManifest["contentBlocks"] | null;
  edit_key_hash?: string | null;
  logo_url?: string | null;
  widget_enabled?: boolean | null;
  widget_position?: IntegrationManifest["widgetPosition"] | null;
  created_at: string;
  updated_at: string;
};

function fromRow(row: ManifestRow): IntegrationManifest {
  return normalizeManifest({
    id: row.id,
    slug: row.slug,
    name: row.name,
    color: row.color,
    appId: row.app_id ?? row.slug,
    version: row.version ?? "1.0.0",
    panels: row.panels ?? [],
    surfaces: row.surfaces ?? [],
    views: row.views ?? [],
    actions: row.actions ?? [],
    designSystem: row.design_system ?? undefined,
    constraints: row.constraints ?? undefined,
    profiles: row.profiles ?? undefined,
    contentBlocks: row.content_blocks ?? undefined,
    editKeyHash: row.edit_key_hash ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    widgetEnabled: row.widget_enabled ?? undefined,
    widgetPosition: row.widget_position ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });
}

export async function loadManifests(supabase: SupabaseClient, _user: User): Promise<IntegrationManifest[] | null> {
  const { data, error } = await supabase
    .from("manifests")
    .select("id,slug,name,color,app_id,version,panels,surfaces,views,actions,design_system,constraints,profiles,content_blocks,edit_key_hash,logo_url,widget_enabled,widget_position,created_at,updated_at")
    .order("updated_at", { ascending: false })
    .returns<ManifestRow[]>();

  if (error) {
    return null;
  }

  return (data ?? []).map(fromRow);
}

export async function saveManifestToSupabase(supabase: SupabaseClient, userId: string, manifest: IntegrationManifest) {
  return supabase.from("manifests").upsert({
    id: manifest.id,
    user_id: userId,
    slug: manifest.slug,
    name: manifest.name,
    color: manifest.color,
    app_id: manifest.appId,
    version: manifest.version,
    panels: manifest.panels,
    surfaces: manifest.surfaces,
    views: manifest.views,
    actions: manifest.actions,
    design_system: manifest.designSystem,
    constraints: manifest.constraints,
    profiles: manifest.profiles,
    content_blocks: manifest.contentBlocks,
    edit_key_hash: manifest.editKeyHash ?? null,
    logo_url: manifest.logoUrl ?? null,
    widget_enabled: manifest.widgetEnabled ?? false,
    widget_position: manifest.widgetPosition ?? "bottom-right"
  });
}

export async function deleteManifestFromSupabase(supabase: SupabaseClient, userId: string, manifestId: string) {
  return supabase.from("manifests").delete().eq("user_id", userId).eq("id", manifestId);
}
