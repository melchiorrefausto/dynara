import { NextResponse } from "next/server";
import { createSupabaseUserClient } from "@/lib/supabase/server";
import { syncFigmaFile, parseFigmaFileKey, getResolvedColorValue } from "@/lib/figma/api";
import type { WorkspaceBlock, TokenItem } from "@/types/workspace";

type SyncBody = { fileUrl?: string };

export async function POST(request: Request) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ error: "Sign in before syncing Figma." }, { status: 401 });
  }

  const supabase = createSupabaseUserClient(accessToken);
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { data, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !data.user) {
    return NextResponse.json({ error: "Your session could not be verified." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as SyncBody;
  const fileKey = body.fileUrl ? parseFigmaFileKey(body.fileUrl) : null;
  if (!fileKey) {
    return NextResponse.json(
      { error: "Provide a valid Figma file URL (e.g. https://www.figma.com/file/KEY/Name)." },
      { status: 400 }
    );
  }

  const { data: account, error: accountError } = await supabase
    .from("connector_accounts")
    .select("access_token_ciphertext, metadata")
    .eq("user_id", data.user.id)
    .eq("provider", "figma")
    .maybeSingle<{ access_token_ciphertext: string; metadata: Record<string, unknown> }>();

  if (accountError || !account?.access_token_ciphertext) {
    return NextResponse.json(
      { error: "Figma is not connected. Connect Figma first." },
      { status: 400 }
    );
  }

  let syncData;
  try {
    syncData = await syncFigmaFile(account.access_token_ciphertext, fileKey);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Figma sync failed.";
    const isAuth = message.includes("403") || message.includes("401");
    return NextResponse.json(
      { error: isAuth ? "Figma token expired — please reconnect Figma." : message },
      { status: isAuth ? 401 : 502 }
    );
  }

  await supabase
    .from("connector_accounts")
    .update({
      metadata: { ...(account.metadata ?? {}), figmaFileKey: fileKey, figmaFileName: syncData.fileName }
    })
    .eq("user_id", data.user.id)
    .eq("provider", "figma");

  await supabase
    .from("connected_apps")
    .update({ last_sync_at: new Date().toISOString(), status: "connected" })
    .eq("user_id", data.user.id)
    .eq("provider", "figma");

  const blocks = buildWorkspaceBlocks(syncData);

  return NextResponse.json({
    fileName: syncData.fileName,
    fileKey,
    componentCount: syncData.components.length,
    variableCount: syncData.variables.length,
    blocks
  });
}

function buildWorkspaceBlocks(syncData: Awaited<ReturnType<typeof syncFigmaFile>>): WorkspaceBlock[] {
  const { fileName, components, variables, collections } = syncData;
  const blocks: WorkspaceBlock[] = [];

  blocks.push({
    type: "metric_card",
    title: "Components",
    value: String(components.length),
    tone: "purple"
  });

  blocks.push({
    type: "metric_card",
    title: "Design Tokens",
    value: String(variables.filter((v) => !v.hiddenFromPublishing).length),
    tone: "blue"
  });

  const visibleComponents = components.slice(0, 30);
  if (visibleComponents.length > 0) {
    blocks.push({
      type: "component_list",
      title: "Components",
      items: visibleComponents.map((c) => ({
        id: c.key,
        title: c.name,
        subtitle: c.containing_frame?.name ?? c.description ?? undefined,
        status: "stable"
      }))
    });
  }

  const tokenItems: TokenItem[] = [];

  for (const variable of variables) {
    if (variable.hiddenFromPublishing) continue;

    if (variable.resolvedType === "COLOR") {
      const hex = getResolvedColorValue(variable, collections);
      if (hex) {
        tokenItems.push({ id: variable.id, name: variable.name, value: hex, category: "Color" });
      }
    } else if (variable.resolvedType === "FLOAT") {
      const nameLower = variable.name.toLowerCase();
      const category = nameLower.includes("radius") || nameLower.includes("corner")
        ? "Radius"
        : nameLower.includes("space") || nameLower.includes("gap") || nameLower.includes("padding")
        ? "Spacing"
        : "Spacing";
      const collection = collections.find((c) => c.variableIds.includes(variable.id));
      const raw = collection ? variable.valuesByMode[collection.defaultModeId] : undefined;
      if (typeof raw === "number") {
        tokenItems.push({ id: variable.id, name: variable.name, value: `${raw}px`, category });
      }
    }
  }

  if (tokenItems.length > 0) {
    blocks.push({ type: "token_table", title: "Design Tokens", items: tokenItems });
  }

  blocks.push({
    type: "activity_feed",
    title: "Recent activity",
    items: [
      {
        id: "sync-1",
        actor: "Figma",
        event: `Synced ${components.length} components from "${fileName}"`,
        time: "just now"
      },
      {
        id: "sync-2",
        actor: "Dynara",
        event: `Found ${variables.length} design tokens`,
        time: "just now"
      }
    ]
  });

  blocks.push({
    type: "quick_actions",
    title: "Quick actions",
    actions: [
      { id: "sync-variables", label: "Re-sync Figma" },
      { id: "export-report", label: "Export report" },
      { id: "scan-file", label: "Scan file" },
      { id: "cleanup", label: "Suggestions" }
    ]
  });

  return blocks;
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  return header.slice("bearer ".length).trim();
}
