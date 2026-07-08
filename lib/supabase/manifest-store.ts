import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { IntegrationManifest } from "@/types/manifest";

type ManifestRow = {
  id: string;
  slug: string;
  name: string;
  color: string;
  panels: IntegrationManifest["panels"];
  views: IntegrationManifest["views"];
  actions: IntegrationManifest["actions"];
  created_at: string;
  updated_at: string;
};

function fromRow(row: ManifestRow): IntegrationManifest {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    color: row.color,
    panels: row.panels ?? [],
    views: row.views ?? [],
    actions: row.actions ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function loadManifests(supabase: SupabaseClient, _user: User): Promise<IntegrationManifest[] | null> {
  const { data, error } = await supabase
    .from("manifests")
    .select("id,slug,name,color,panels,views,actions,created_at,updated_at")
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
    panels: manifest.panels,
    views: manifest.views,
    actions: manifest.actions
  });
}

export async function deleteManifestFromSupabase(supabase: SupabaseClient, userId: string, manifestId: string) {
  return supabase.from("manifests").delete().eq("user_id", userId).eq("id", manifestId);
}
