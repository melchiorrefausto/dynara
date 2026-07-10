import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentBlock } from "@/types/manifest";

export type ContentEditDraft = {
  id: string;
  manifestId: string;
  userId: string;
  appId: string;
  pageUrl: string;
  pagePath: string;
  blocks: ContentBlock[];
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string | null;
};

type ContentEditDraftRow = {
  id: string;
  manifest_id: string;
  user_id: string;
  app_id: string;
  page_url: string;
  page_path: string;
  blocks: ContentBlock[];
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  reviewed_at?: string | null;
};

export async function loadPendingContentEditDrafts(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("content_edit_drafts")
    .select("id,manifest_id,user_id,app_id,page_url,page_path,blocks,status,submitted_at,reviewed_at")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("submitted_at", { ascending: false })
    .returns<ContentEditDraftRow[]>();

  if (error) return null;
  return (data ?? []).map(fromRow);
}

export async function markContentEditDraftReviewed(
  supabase: SupabaseClient,
  draftId: string,
  status: "approved" | "rejected"
) {
  return supabase
    .from("content_edit_drafts")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", draftId);
}

function fromRow(row: ContentEditDraftRow): ContentEditDraft {
  return {
    id: row.id,
    manifestId: row.manifest_id,
    userId: row.user_id,
    appId: row.app_id,
    pageUrl: row.page_url,
    pagePath: row.page_path,
    blocks: Array.isArray(row.blocks) ? row.blocks : [],
    status: row.status,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at
  };
}
