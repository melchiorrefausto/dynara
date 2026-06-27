import type { Connector, ConnectorConnection, ConnectorProvider, ConnectorSyncResult } from "@/lib/connectors/types";
import type { AdapterPrimitive, WorkspaceAction } from "@/types/workspace";

export const figmaProvider: ConnectorProvider = "figma";

export function createFigmaConnector(): Connector {
  return {
    provider: figmaProvider,
    name: "Figma",

    async connect(): Promise<ConnectorConnection> {
      return { provider: figmaProvider, name: "Figma", status: "connected", lastSync: "just now" };
    },

    async disconnect(): Promise<ConnectorConnection> {
      return { provider: figmaProvider, name: "Figma", status: "available" };
    },

    async getStatus(): Promise<ConnectorConnection> {
      return { provider: figmaProvider, name: "Figma", status: "available" };
    },

    async sync(): Promise<ConnectorSyncResult> {
      return { status: "queued", message: "Use the file picker to load Figma primitives." };
    },

    async listPrimitives(): Promise<AdapterPrimitive[]> {
      // Primitives are loaded via /api/figma/primitives and stored in workspace state.
      // This method is a pass-through — the client calls the API directly.
      return [];
    },

    async runAction(action: WorkspaceAction): Promise<ConnectorSyncResult> {
      // Actions that can be executed client-side via URL
      if (action.id === "figma:action:open_file" || action.id === "open_file") {
        return { status: "completed", message: "Opening Figma file." };
      }
      if (action.id === "export-report") {
        return { status: "completed", message: "Report exported." };
      }
      return { status: "queued", message: `Action "${action.label}" queued.` };
    }
  };
}
