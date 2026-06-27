import { NextResponse } from "next/server";
import { createSupabaseUserClient } from "@/lib/supabase/server";
import { extractFigmaPrimitives } from "@/lib/figma/primitives";
import { parseFigmaFileKey } from "@/lib/figma/api";

type Body = { fileUrl?: string };

export async function POST(request: Request) {
  const accessToken = getBearerToken(request);
  if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseUserClient(accessToken);
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return NextResponse.json({ error: "Bad session" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Body;
  const fileKey = body.fileUrl ? parseFigmaFileKey(body.fileUrl) : null;
  if (!fileKey) return NextResponse.json({ error: "Provide a valid Figma file URL." }, { status: 400 });

  const { data: account } = await supabase
    .from("connector_accounts")
    .select("access_token_ciphertext")
    .eq("user_id", data.user.id)
    .eq("provider", "figma")
    .maybeSingle<{ access_token_ciphertext: string }>();

  if (!account?.access_token_ciphertext) {
    return NextResponse.json({ error: "Figma not connected." }, { status: 400 });
  }

  try {
    const context = await extractFigmaPrimitives(account.access_token_ciphertext, fileKey);

    // Persist fileKey so generate-workspace can reload primitives without re-asking
    await supabase
      .from("connector_accounts")
      .update({ metadata: { figmaFileKey: fileKey, figmaFileName: context.fileName } })
      .eq("user_id", data.user.id)
      .eq("provider", "figma");

    return NextResponse.json(context);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load Figma primitives.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

function getBearerToken(request: Request) {
  const h = request.headers.get("authorization");
  if (!h?.toLowerCase().startsWith("bearer ")) return null;
  return h.slice(7).trim();
}
