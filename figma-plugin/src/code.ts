/// <reference types="@figma/plugin-typings" />

figma.showUI(__html__, { width: 380, height: 600, title: "Dynara" });

type PluginMessage =
  | { type: "GET_PRIMITIVES" }
  | { type: "SELECT_NODE"; nodeId: string }
  | { type: "NAVIGATE_PAGE"; pageId: string }
  | { type: "NOTIFY"; message: string }
  | { type: "RESIZE"; width: number; height: number }
  | { type: "CLOSE" };

function extractPrimitives() {
  const components = figma.currentPage.findAllWithCriteria({
    types: ["COMPONENT", "COMPONENT_SET"]
  }).map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    description: "description" in c ? (c.description as string) : "",
    width: Math.round("width" in c ? (c.width as number) : 0),
    height: Math.round("height" in c ? (c.height as number) : 0),
  }));

  const paintStyles = figma.getLocalPaintStyles().map((s) => {
    let hex = "#e2e8f0";
    const paint = s.paints[0];
    if (paint?.type === "SOLID") {
      const { r, g, b } = paint.color;
      hex = `#${[r, g, b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("")}`;
    }
    return { id: s.id, name: s.name, hex, description: s.description };
  });

  const textStyles = figma.getLocalTextStyles().map((s) => ({
    id: s.id,
    name: s.name,
    fontSize: s.fontSize,
    fontFamily: s.fontName.family,
    fontWeight: s.fontName.style,
    description: s.description
  }));

  const effectStyles = figma.getLocalEffectStyles().map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description
  }));

  const pages = figma.root.children.map((p) => ({
    id: p.id,
    name: p.name,
    isCurrent: p.id === figma.currentPage.id
  }));

  figma.ui.postMessage({
    type: "PRIMITIVES_READY",
    payload: {
      fileName: figma.root.name,
      currentPage: figma.currentPage.name,
      components,
      paintStyles,
      textStyles,
      effectStyles,
      pages
    }
  });
}

figma.ui.onmessage = async (msg: PluginMessage) => {
  switch (msg.type) {
    case "GET_PRIMITIVES":
      extractPrimitives();
      break;

    case "SELECT_NODE": {
      const node = await figma.getNodeByIdAsync(msg.nodeId);
      if (node && node.type !== "DOCUMENT" && node.type !== "PAGE") {
        figma.currentPage.selection = [node as SceneNode];
        figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
      }
      break;
    }

    case "NAVIGATE_PAGE": {
      const page = figma.root.children.find((p) => p.id === msg.pageId);
      if (page) {
        await figma.setCurrentPageAsync(page);
        extractPrimitives();
      }
      break;
    }

    case "NOTIFY":
      figma.notify(msg.message);
      break;

    case "RESIZE":
      figma.ui.resize(msg.width, msg.height);
      break;

    case "CLOSE":
      figma.closePlugin();
      break;
  }
};
