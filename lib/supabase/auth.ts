import { NextResponse } from "next/server";
import { createSupabaseUserClient } from "@/lib/supabase/server";

export async function getAuthedClient(request: Request, corsHeaders: Record<string, string>) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return { response: NextResponse.json({ error: "Unauthorized." }, { status: 401, headers: corsHeaders }) };
  }

  const supabase = createSupabaseUserClient(accessToken);
  if (!supabase) {
    return { response: NextResponse.json({ error: "Supabase is not configured." }, { status: 500, headers: corsHeaders }) };
  }

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    return { response: NextResponse.json({ error: "Bad session." }, { status: 401, headers: corsHeaders }) };
  }

  return { supabase, user: data.user };
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  return header.slice("bearer ".length).trim();
}
