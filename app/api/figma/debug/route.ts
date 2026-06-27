import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { parseFigmaFileKey } from "@/lib/figma/api";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const supabase = createServerClient(url, anonKey, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} }
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const reqUrl = new URL(request.url);
  const fileUrl = reqUrl.searchParams.get("fileUrl") ?? "";
  const fileKey = parseFigmaFileKey(fileUrl);
  if (!fileKey) return NextResponse.json({ error: "Bad fileUrl" }, { status: 400 });

  const { data: account } = await supabase
    .from("connector_accounts")
    .select("access_token_ciphertext")
    .eq("provider", "figma")
    .maybeSingle<{ access_token_ciphertext: string }>();

  if (!account?.access_token_ciphertext) return NextResponse.json({ error: "Figma not connected" }, { status: 400 });

  const figmaToken = account.access_token_ciphertext;

  const [fileRes, componentsRes, variablesRes] = await Promise.allSettled([
    fetch(`https://api.figma.com/v1/files/${fileKey}`, { headers: { Authorization: `Bearer ${figmaToken}` } }),
    fetch(`https://api.figma.com/v1/files/${fileKey}/components`, { headers: { Authorization: `Bearer ${figmaToken}` } }),
    fetch(`https://api.figma.com/v1/files/${fileKey}/variables/local`, { headers: { Authorization: `Bearer ${figmaToken}` } })
  ]);

  const fileJson = fileRes.status === "fulfilled" ? await fileRes.value.json() : null;
  const componentsJson = componentsRes.status === "fulfilled" ? await componentsRes.value.json() : null;
  const variablesJson = variablesRes.status === "fulfilled" ? await variablesRes.value.json() : null;

  // Count node types in document
  const nodeTypeCounts: Record<string, number> = {};
  function countNodes(node: { type?: string; children?: unknown[] }) {
    if (node.type) nodeTypeCounts[node.type] = (nodeTypeCounts[node.type] ?? 0) + 1;
    for (const child of (node.children ?? []) as { type?: string; children?: unknown[] }[]) countNodes(child);
  }
  if (fileJson?.document) countNodes(fileJson.document);

  return NextResponse.json({
    fileName: fileJson?.name,
    nodeTypeCounts,
    styles: Object.keys(fileJson?.styles ?? {}).length,
    stylesSample: Object.entries(fileJson?.styles ?? {}).slice(0, 5),
    publishedComponents: componentsJson?.meta?.components?.length ?? componentsJson?.err ?? componentsJson,
    variablesStatus: variablesJson?.status ?? variablesJson?.error,
    variableCount: Object.keys(variablesJson?.meta?.variables ?? {}).length,
  });
}

