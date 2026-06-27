import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseUserClient } from "@/lib/supabase/server";

const figmaScopes = ["current_user:read", "file_content:read", "library_assets:read", "library_content:read"];

type FigmaTokenResponse = {
  user_id_string?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  message?: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? url.origin;
  const dashboardUrl = new URL("/dashboard", appUrl);
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("dynara_figma_oauth_state")?.value;
  const verifier = cookieStore.get("dynara_figma_code_verifier")?.value;
  const supabaseAccessToken = cookieStore.get("dynara_connector_supabase_token")?.value;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return redirectWithStatus(dashboardUrl, "failed", error);
  }

  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    return redirectWithStatus(dashboardUrl, "failed", "Figma authorization state was invalid.");
  }

  if (!supabaseAccessToken) {
    return redirectWithStatus(dashboardUrl, "failed", "Your Dynara session expired during Figma authorization.");
  }

  const tokenPayload = await exchangeCodeForToken(code, verifier, `${appUrl.replace(/\/$/, "")}/api/connectors/figma/callback`);

  if (!tokenPayload.access_token) {
    return redirectWithStatus(dashboardUrl, "failed", tokenPayload.error ?? tokenPayload.message ?? "Figma token exchange failed.");
  }

  const supabase = createSupabaseUserClient(supabaseAccessToken);
  if (!supabase) {
    return redirectWithStatus(dashboardUrl, "failed", "Supabase is not configured.");
  }

  const { data, error: userError } = await supabase.auth.getUser(supabaseAccessToken);
  if (userError || !data.user) {
    return redirectWithStatus(dashboardUrl, "failed", "Your Dynara session could not be verified.");
  }

  const expiresAt = tokenPayload.expires_in
    ? new Date(Date.now() + tokenPayload.expires_in * 1000).toISOString()
    : null;

  const [accountResult, appResult] = await Promise.all([
    supabase.from("connector_accounts").upsert(
      {
        user_id: data.user.id,
        provider: "figma",
        provider_account_id: tokenPayload.user_id_string ?? null,
        access_token_ciphertext: tokenPayload.access_token,
        refresh_token_ciphertext: tokenPayload.refresh_token ?? null,
        scopes: figmaScopes,
        expires_at: expiresAt,
        metadata: { token_type: "bearer" }
      },
      { onConflict: "user_id,provider" }
    ),
    supabase.from("connected_apps").upsert(
      {
        id: `${data.user.id}:figma`,
        user_id: data.user.id,
        provider: "figma",
        name: "Figma",
        status: "connected",
        last_sync_at: new Date().toISOString()
      },
      { onConflict: "user_id,provider" }
    )
  ]);

  if (accountResult.error || appResult.error) {
    return redirectWithStatus(
      dashboardUrl,
      "failed",
      accountResult.error?.message ?? appResult.error?.message ?? "Could not save Figma connection."
    );
  }

  const response = redirectWithStatus(dashboardUrl, "connected", "Figma connected.");
  clearOauthCookies(response);
  return response;
}

async function exchangeCodeForToken(code: string, verifier: string, redirectUri: string): Promise<FigmaTokenResponse> {
  const clientId = process.env.FIGMA_CLIENT_ID;
  const clientSecret = process.env.FIGMA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { error: "Figma OAuth is missing FIGMA_CLIENT_ID or FIGMA_CLIENT_SECRET." };
  }

  const body = new URLSearchParams({
    redirect_uri: redirectUri,
    code,
    grant_type: "authorization_code",
    code_verifier: verifier
  });

  const response = await fetch("https://api.figma.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const payload = (await response.json().catch(() => ({}))) as FigmaTokenResponse;

  if (!response.ok) {
    return {
      error: payload.error ?? payload.message ?? `Figma token exchange failed with ${response.status}.`
    };
  }

  return payload;
}

function redirectWithStatus(dashboardUrl: URL, status: "connected" | "failed", message: string) {
  dashboardUrl.searchParams.set("connector", "figma");
  dashboardUrl.searchParams.set("status", status);
  dashboardUrl.searchParams.set("message", message);
  return NextResponse.redirect(dashboardUrl);
}

function clearOauthCookies(response: NextResponse) {
  response.cookies.delete("dynara_figma_oauth_state");
  response.cookies.delete("dynara_figma_code_verifier");
  response.cookies.delete("dynara_connector_supabase_token");
}
