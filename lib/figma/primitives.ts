import type { AdapterPrimitive } from "@/types/workspace";

type FigmaNode = { id: string; name: string; type: string; children?: FigmaNode[]; description?: string };
type FigmaFileResponse = {
  name: string;
  lastModified: string;
  document: FigmaNode;
  styles?: Record<string, { name: string; styleType: string; description?: string }>;
};
type FigmaComment = { id: string; message: string; created_at: string; user: { handle: string } };
type FigmaVersion = { id: string; label?: string; description?: string; created_at: string; user: { handle: string } };
type FigmaComponentMeta = { key: string; node_id: string; name: string; description: string };

async function figmaGet<T>(path: string, token: string): Promise<T | null> {
  const res = await fetch(`https://api.figma.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 }
  });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

function walkComponents(node: FigmaNode, out: FigmaNode[] = []): FigmaNode[] {
  if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") out.push(node);
  for (const child of node.children ?? []) walkComponents(child, out);
  return out;
}

export type FigmaPrimitiveContext = {
  fileKey: string;
  fileName: string;
  lastModified: string;
  primitives: AdapterPrimitive[];
  summary: string;
};

export async function extractFigmaPrimitives(
  token: string,
  fileKey: string
): Promise<FigmaPrimitiveContext> {
  const [file, publishedComponents, comments, versions] = await Promise.allSettled([
    figmaGet<FigmaFileResponse>(`/v1/files/${fileKey}`, token),
    figmaGet<{ meta: { components: FigmaComponentMeta[] } }>(`/v1/files/${fileKey}/components`, token),
    figmaGet<{ comments: FigmaComment[] }>(`/v1/files/${fileKey}/comments`, token),
    figmaGet<{ versions: FigmaVersion[] }>(`/v1/files/${fileKey}/versions`, token)
  ]);

  const fileData = file.status === "fulfilled" ? file.value : null;
  const fileName = fileData?.name ?? "Figma File";
  const lastModified = fileData?.lastModified ?? new Date().toISOString();

  const primitives: AdapterPrimitive[] = [];

  // FILE object primitive
  primitives.push({
    id: `figma:file:${fileKey}`,
    source: "figma",
    type: "object",
    name: fileName,
    metadata: { kind: "file", fileKey, lastModified }
  });

  // COMPONENTS
  let componentNodes: FigmaNode[] = [];
  if (publishedComponents.status === "fulfilled" && (publishedComponents.value?.meta?.components?.length ?? 0) > 0) {
    const pub = publishedComponents.value!.meta.components;
    for (const c of pub.slice(0, 50)) {
      primitives.push({
        id: `figma:component:${c.key}`,
        source: "figma",
        type: "object",
        name: c.name,
        metadata: { kind: "component", nodeId: c.node_id, fileKey, description: c.description }
      });
    }
    componentNodes = pub.map((c) => ({ id: c.node_id, name: c.name, type: "COMPONENT" }));
  } else if (fileData?.document) {
    componentNodes = walkComponents(fileData.document).slice(0, 50);
    for (const c of componentNodes) {
      primitives.push({
        id: `figma:component:${c.id}`,
        source: "figma",
        type: "object",
        name: c.name,
        metadata: { kind: "component", nodeId: c.id, fileKey, description: c.description ?? "" }
      });
    }
  }

  // STYLES as token primitives
  const styles = fileData?.styles ?? {};
  for (const [id, style] of Object.entries(styles).slice(0, 30)) {
    primitives.push({
      id: `figma:style:${id}`,
      source: "figma",
      type: "object",
      name: style.name,
      metadata: { kind: "style", styleType: style.styleType, fileKey }
    });
  }

  // COMMENTS
  const recentComments = comments.status === "fulfilled" ? (comments.value?.comments ?? []).slice(0, 10) : [];
  for (const c of recentComments) {
    primitives.push({
      id: `figma:comment:${c.id}`,
      source: "figma",
      type: "object",
      name: c.message.slice(0, 80),
      metadata: { kind: "comment", author: c.user.handle, createdAt: c.created_at }
    });
  }

  // VERSIONS
  const recentVersions = versions.status === "fulfilled" ? (versions.value?.versions ?? []).slice(0, 5) : [];
  for (const v of recentVersions) {
    if (v.label) {
      primitives.push({
        id: `figma:version:${v.id}`,
        source: "figma",
        type: "object",
        name: v.label,
        metadata: { kind: "version", description: v.description ?? "", author: v.user.handle, createdAt: v.created_at }
      });
    }
  }

  // ACTIONS
  primitives.push({
    id: "figma:action:open_file",
    source: "figma",
    type: "action",
    name: "Open in Figma",
    metadata: { url: `https://www.figma.com/design/${fileKey}` }
  });
  primitives.push({
    id: "figma:action:copy_link",
    source: "figma",
    type: "action",
    name: "Copy file link",
    metadata: { url: `https://www.figma.com/design/${fileKey}` }
  });
  primitives.push({
    id: "figma:action:add_comment",
    source: "figma",
    type: "action",
    name: "Add comment",
    metadata: { endpoint: `/v1/files/${fileKey}/comments` }
  });

  // WORKFLOWS
  const workflows = [
    { id: "design_system", name: "Design System Review", description: "Review components, tokens, and documentation" },
    { id: "dev_handoff", name: "Developer Handoff", description: "Check what is ready for development" },
    { id: "accessibility", name: "Accessibility Audit", description: "Review contrast, sizing, and ARIA" },
    { id: "client_feedback", name: "Client Feedback", description: "Collect and review client annotations" },
    { id: "component_audit", name: "Component Audit", description: "Find missing variants and broken components" }
  ];
  for (const wf of workflows) {
    primitives.push({
      id: `figma:workflow:${wf.id}`,
      source: "figma",
      type: "workflow",
      name: wf.name,
      metadata: { description: wf.description }
    });
  }

  const summary = buildSummary({ fileName, componentCount: componentNodes.length, styleCount: Object.keys(styles).length, commentCount: recentComments.length, versionCount: recentVersions.length });

  return { fileKey, fileName, lastModified, primitives, summary };
}

function buildSummary(info: {
  fileName: string;
  componentCount: number;
  styleCount: number;
  commentCount: number;
  versionCount: number;
}) {
  const parts = [`Figma file: "${info.fileName}"`];
  if (info.componentCount > 0) parts.push(`${info.componentCount} components`);
  if (info.styleCount > 0) parts.push(`${info.styleCount} styles`);
  if (info.commentCount > 0) parts.push(`${info.commentCount} recent comments`);
  if (info.versionCount > 0) parts.push(`${info.versionCount} named versions`);
  return parts.join(", ");
}
