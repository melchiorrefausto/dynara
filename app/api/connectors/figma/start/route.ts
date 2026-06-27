import { createHash, randomBytes, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createSupabaseUserClient } from "@/lib/supabase/server";

const figmaScopes = ["current_user:read", "file_content:read", "library_assets:read", "library_content:read"];
const cookieMaxAge = 10 * 60;

export async function POST(request: Request) {
  const clientId = process.env.FIGMA_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const accessToken = getBearerToken(request);

  if (!clientId) {
    return NextResponse.json({ error: "Figma OAuth is missing FIGMA_CLIENT_ID." }, { status: 500 });
  }

  if (!accessToken) {
    return NextResponse.json({ error: "Sign in before connecting Figma." }, { status: 401 });
  }

  const supabase = createSupabaseUserClient(accessToken);
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    return NextResponse.json({ error: "Your session could not be verified." }, { status: 401 });
  }

  const state = randomUUID();
  const verifier = base64Url(randomBytes(32));
  const challenge = base64Url(createHash("sha256").update(verifier).digest());
  const redirectUri = `${appUrl.replace(/\/$/, "")}/api/connectors/figma/callback`;
  const authUrl = new URL("https://www.figma.com/oauth");

  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", figmaScopes.join(","));
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.json({ authUrl: authUrl.toString() });
  response.cookies.set("dynara_figma_oauth_state", state, oauthCookieOptions());
  response.cookies.set("dynara_figma_code_verifier", verifier, oauthCookieOptions());
  response.cookies.set("dynara_connector_supabase_token", accessToken, oauthCookieOptions());
  return response;
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice("bearer ".length).trim();
}

function base64Url(value: Buffer) {
  return value.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function oauthCookieOptions() {
  return {
    httpOnly: true,
    maxAge: cookieMaxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production"
  };
}
