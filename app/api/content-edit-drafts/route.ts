import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { ContentBlock } from "@/types/manifest";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

type SubmitDraftBody = {
  appId?: string;
  password?: string;
  pageUrl?: string;
  pagePath?: string;
  blocks?: ContentBlock[];
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SubmitDraftBody | null;
  const blocks = Array.isArray(body?.blocks) ? body.blocks.filter(isContentBlock).slice(0, 100) : [];

  if (!body?.appId || !body.password || blocks.length === 0) {
    return NextResponse.json(
      { error: "Provide appId, password, and at least one content block." },
      { status: 400, headers: CORS }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500, headers: CORS });
  }

  const supabase = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { data, error } = await supabase.rpc("submit_content_edit_draft", {
    p_app_id: body.appId,
    p_edit_password: body.password,
    p_page_url: body.pageUrl ?? "",
    p_page_path: body.pagePath ?? "/",
    p_blocks: blocks
  });

  if (error) {
    const message = error.message.includes("Invalid edit password")
      ? "Invalid edit password."
      : error.message;
    return NextResponse.json({ error: message }, { status: 403, headers: CORS });
  }

  return NextResponse.json({ ok: true, draftId: data }, { headers: CORS });
}

function isContentBlock(value: unknown): value is ContentBlock {
  if (!value || typeof value !== "object") return false;
  const block = value as Partial<ContentBlock>;
  return (
    typeof block.id === "string" &&
    typeof block.key === "string" &&
    (block.type === "text" || block.type === "image") &&
    typeof block.selector === "string" &&
    typeof block.value === "string"
  );
}
