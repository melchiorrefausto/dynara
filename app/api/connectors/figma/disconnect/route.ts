import { NextResponse } from "next/server";
import { createSupabaseUserClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    return NextResponse.json({ error: "Sign in before disconnecting Figma." }, { status: 401 });
  }

  const supabase = createSupabaseUserClient(accessToken);
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    return NextResponse.json({ error: "Your session could not be verified." }, { status: 401 });
  }

  const [accountResult, appResult] = await Promise.all([
    supabase.from("connector_accounts").delete().eq("user_id", data.user.id).eq("provider", "figma"),
    supabase.from("connected_apps").upsert(
      {
        id: `${data.user.id}:figma`,
        user_id: data.user.id,
        provider: "figma",
        name: "Figma",
        status: "available",
        last_sync_at: null
      },
      { onConflict: "user_id,provider" }
    )
  ]);

  if (accountResult.error || appResult.error) {
    return NextResponse.json(
      { error: accountResult.error?.message ?? appResult.error?.message ?? "Could not disconnect Figma." },
      { status: 500 }
    );
  }

  return NextResponse.json({ status: "available" });
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice("bearer ".length).trim();
}
