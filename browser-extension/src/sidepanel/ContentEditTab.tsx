import { useEffect, useState } from "react";
import type { ContentBlock } from "../shared/manifest";

type ContentEditState = { contentEditMode: boolean; blocks: ContentBlock[]; available?: boolean; requiresPassword?: boolean };

export function ContentEditTab({ tabId, backendUrl }: { tabId: number | null; backendUrl: string }) {
  const [state, setState] = useState<ContentEditState>({ contentEditMode: false, blocks: [] });
  const [scanned, setScanned] = useState<ContentBlock[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!tabId) return;
    chrome.runtime.sendMessage({ type: "GET_CONTENT_EDIT_STATE_IN_TAB", tabId }, (res: ContentEditState) => {
      if (!chrome.runtime.lastError && res) setState(res);
    });
  }, [tabId]);

  useEffect(() => {
    const onMessage = (message: { type?: string; block?: ContentBlock }) => {
      if (message.type !== "CONTENT_BLOCK_SAVED" || !message.block) return;
      setState((current) => {
        const blocks = current.blocks.filter((item) => item.id !== message.block!.id);
        blocks.push(message.block!);
        return { ...current, blocks };
      });
    };
    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, []);

  function toggleEditMode() {
    if (!tabId) return;
    const enabled = !state.contentEditMode;
    chrome.runtime.sendMessage(
      { type: "SET_CONTENT_EDIT_MODE_IN_TAB", tabId, enabled },
      (res: ContentEditState & { needsPassword?: boolean }) => {
        if (chrome.runtime.lastError || !res) return;
        setState(res);
      }
    );
  }

  function unlockEdit() {
    if (!tabId || !password.trim()) return;
    setUnlocking(true);
    setUnlockError(null);
    chrome.runtime.sendMessage(
      { type: "UNLOCK_CONTENT_EDIT_IN_TAB", tabId, password: password.trim() },
      (res: ContentEditState & { ok: boolean }) => {
        setUnlocking(false);
        if (chrome.runtime.lastError || !res) return;
        if (!res.ok) {
          setUnlockError("Wrong password. Ask the site owner for the edit link.");
          return;
        }
        setPassword("");
        setState(res);
      }
    );
  }

  function scanPage() {
    if (!tabId) return;
    setLoading(true);
    chrome.runtime.sendMessage({ type: "SCAN_CONTENT_BLOCKS_IN_TAB", tabId }, (res: { blocks: ContentBlock[] }) => {
      setLoading(false);
      if (!chrome.runtime.lastError && res) setScanned(res.blocks);
    });
  }

  function clearEdits() {
    if (!tabId) return;
    chrome.runtime.sendMessage({ type: "CLEAR_CONTENT_BLOCKS_IN_TAB", tabId }, (res: ContentEditState) => {
      if (!chrome.runtime.lastError && res) {
        setState(res);
        setScanned(null);
      }
    });
  }

  function submitDraft() {
    if (!tabId || state.blocks.length === 0) return;
    setSubmitting(true);
    setSubmitFeedback(null);
    chrome.runtime.sendMessage(
      { type: "SUBMIT_CONTENT_EDIT_DRAFT_IN_TAB", tabId, backendUrl },
      (res: { ok?: boolean; error?: string; draftId?: string }) => {
        setSubmitting(false);
        if (chrome.runtime.lastError || !res?.ok) {
          setSubmitFeedback(res?.error ?? "Could not submit edits.");
          return;
        }
        setSubmitFeedback("Submitted to dashboard for review.");
      }
    );
  }

  const blocks = state.blocks.length > 0 ? state.blocks : scanned ?? [];
  const available = Boolean(state.available);
  const locked = available && Boolean(state.requiresPassword) && !state.contentEditMode;

  if (!available) {
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <p style={{ fontSize: 12, lineHeight: 1.6, color: "#64748b", margin: "0 0 14px" }}>
          Click-to-edit text and images directly on this page — works on any site, no manifest required.
        </p>
        <div style={{ border: "1px solid #e8edf5", borderRadius: 10, padding: 14, background: "#f8fafc" }}>
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: "#0f172a" }}>🔒 Edit mode isn&apos;t set up yet</p>
          <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#64748b", lineHeight: 1.5 }}>
            The site owner needs to set an edit password in their Dynara dashboard before this page can be edited.
            This keeps Edit mode from being usable on a site without the owner&apos;s consent.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
      <p style={{ fontSize: 12, lineHeight: 1.6, color: "#64748b", margin: "0 0 14px" }}>
        Click-to-edit text and images directly on this page — works on any site, no manifest required. Edits save to
        this browser and reapply automatically on reload.
      </p>

      {locked ? (
        <div style={{ border: "1px solid #e8edf5", borderRadius: 10, padding: 14, background: "#f8fafc" }}>
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: "#0f172a" }}>🔒 This page is password-protected</p>
          <p style={{ margin: "4px 0 10px", fontSize: 11.5, color: "#64748b", lineHeight: 1.5 }}>
            Enter the edit password the site owner shared with you — or open the dedicated edit link they sent, which
            unlocks this automatically.
          </p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && unlockEdit()}
            placeholder="Edit password"
            style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 12, marginBottom: 8 }}
          />
          <button
            onClick={unlockEdit}
            disabled={!password.trim() || unlocking}
            style={{ width: "100%", padding: "9px 0", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 800, cursor: "pointer", background: "#7c3aed", color: "#fff" }}
          >
            {unlocking ? "Checking…" : "Unlock edit mode"}
          </button>
          {unlockError ? <p style={{ margin: "8px 0 0", fontSize: 11, color: "#dc2626", fontWeight: 700 }}>{unlockError}</p> : null}
        </div>
      ) : (
        <button
          onClick={toggleEditMode}
          disabled={!tabId}
          style={{
            width: "100%",
            padding: "10px 0",
            borderRadius: 8,
            border: "none",
            fontSize: 12.5,
            fontWeight: 800,
            cursor: tabId ? "pointer" : "not-allowed",
            background: state.contentEditMode ? "#16a34a" : "#7c3aed",
            color: "#fff"
          }}
        >
          {state.contentEditMode ? "Edit mode active — click text or images" : "Enable edit mode"}
        </button>
      )}

      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        <button
          onClick={scanPage}
          disabled={!tabId || loading}
          style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid #e8edf5", background: "#f8fafc", color: "#334155", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
        >
          {loading ? "Scanning…" : "Scan page for content"}
        </button>
        <button
          onClick={clearEdits}
          disabled={!tabId || state.blocks.length === 0}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #fecaca", background: "#fff", color: "#dc2626", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
        >
          Clear
        </button>
      </div>

      <button
        onClick={submitDraft}
        disabled={!tabId || state.blocks.length === 0 || submitting || locked}
        style={{
          width: "100%",
          marginTop: 8,
          padding: "9px 0",
          borderRadius: 8,
          border: "1px solid #c4b5fd",
          background: state.blocks.length > 0 && !locked ? "#f5f3ff" : "#f8fafc",
          color: state.blocks.length > 0 && !locked ? "#6d28d9" : "#94a3b8",
          fontSize: 11.5,
          fontWeight: 800,
          cursor: state.blocks.length > 0 && !locked ? "pointer" : "not-allowed"
        }}
      >
        {submitting ? "Submitting…" : "Submit edits for review"}
      </button>
      {submitFeedback ? (
        <p style={{ margin: "7px 0 0", fontSize: 11, color: submitFeedback.startsWith("Submitted") ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
          {submitFeedback}
        </p>
      ) : null}

      <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "18px 0 8px" }}>
        {blocks.length > 0 ? `Content blocks (${blocks.length})` : "No content found yet"}
      </p>

      <div style={{ display: "grid", gap: 6 }}>
        {blocks.map((block) => (
          <div key={block.id} style={{ border: "1px solid #e8edf5", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: block.type === "image" ? "#7c3aed" : "#0f172a" }}>
                {block.type === "image" ? "🖼️ Image" : "📝 Text"}
              </span>
              {state.blocks.some((saved) => saved.id === block.id) ? (
                <span style={{ fontSize: 9, fontWeight: 800, color: "#16a34a" }}>Saved</span>
              ) : null}
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#334155", lineHeight: 1.4, wordBreak: "break-word" }}>
              {block.type === "image" ? block.value : block.value || "(empty)"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
