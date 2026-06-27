/// <reference types="@figma/plugin-typings" />

figma.showUI(__html__, { width: 380, height: 580, title: "Dynara" });

type PluginMessage =
  | { type: "GET_PRIMITIVES" }
  | { type: "SELECT_NODE"; nodeId: string }
  | { type: "NOTIFY"; message: string }
  | { type: "RESIZE"; width: number; height: number }
  | { type: "CLOSE" };

function extractPrimitives() {
  const components = figma.currentPage.findAllWithCriteria({
    types: ["COMPONENT", "COMPONENT_SET"]
  });

  const textStyles = figma.getLocalTextStyles().map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description
  }));

  const paintStyles = figma.getLocalPaintStyles().map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description
  }));

  const effectStyles = figma.getLocalEffectStyles().map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description
  }));

  const pages = figma.root.children.map((p) => ({ id: p.id, name: p.name }));

  figma.ui.postMessage({
    type: "PRIMITIVES_READY",
    payload: {
      fileName: figma.root.name,
      currentPage: figma.currentPage.name,
      components: components.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        description: "description" in c ? (c.description as string) : ""
      })),
      textStyles,
      paintStyles,
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

// Load primitives immediately on plugin open
extractPrimitives();
