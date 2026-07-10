import { NextResponse } from "next/server";
import { createBlankManifest, normalizeManifest, slugify } from "@/lib/dashboard/manifest-state";
import { loadManifests, saveManifestToSupabase } from "@/lib/supabase/manifest-store";
import { getAuthedClient } from "@/lib/supabase/auth";
import type { IntegrationManifest } from "@/types/manifest";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type"
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(request: Request) {
  const auth = await getAuthedClient(request, CORS);
  if ("response" in auth) return auth.response;

  const manifests = await loadManifests(auth.supabase, auth.user);
  if (!manifests) {
    return NextResponse.json({ error: "Could not load manifests." }, { status: 500, headers: CORS });
  }

  return NextResponse.json({ manifests }, { headers: CORS });
}

export async function POST(request: Request) {
  const auth = await getAuthedClient(request, CORS);
  if ("response" in auth) return auth.response;

  const body = (await request.json().catch(() => null)) as Partial<IntegrationManifest> | null;
  if (!body?.name) {
    return NextResponse.json({ error: "Provide at least a manifest name." }, { status: 400, headers: CORS });
  }

  const base = createBlankManifest(body.name);
  const manifest = normalizeManifest({
    ...base,
    ...body,
    id: body.id ?? `${auth.user.id}:${body.appId ?? slugify(body.name)}`,
    slug: body.slug ?? slugify(body.name),
    appId: body.appId ?? body.slug ?? slugify(body.name)
  });

  const { error } = await saveManifestToSupabase(auth.supabase, auth.user.id, manifest);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  }

  return NextResponse.json({ manifest }, { headers: CORS });
}
