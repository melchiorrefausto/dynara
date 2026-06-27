import type { Connector, ConnectorConnection, ConnectorProvider, ConnectorSyncResult } from "@/lib/connectors/types";
import type { AdapterPrimitive, WorkspaceAction } from "@/types/workspace";

export const figmaProvider: ConnectorProvider = "figma";

export function createFigmaConnector(): Connector {
  return {
    provider: figmaProvider,
    name: "Figma",
    async connect(): Promise<ConnectorConnection> {
      return {
        provider: figmaProvider,
        name: "Figma",
        status: "connected",
        lastSync: "just now",
        metadata: { auth: "pending-oauth" }
      };
    },
    async disconnect(): Promise<ConnectorConnection> {
      return {
        provider: figmaProvider,
        name: "Figma",
        status: "available"
      };
    },
    async getStatus(): Promise<ConnectorConnection> {
      return {
        provider: figmaProvider,
        name: "Figma",
        status: "available"
      };
    },
    async sync(): Promise<ConnectorSyncResult> {
      return {
        status: "queued",
        message: "Figma sync is ready for OAuth credentials."
      };
    },
    async listPrimitives(): Promise<AdapterPrimitive[]> {
      return [];
    },
    async runAction(action: WorkspaceAction): Promise<ConnectorSyncResult> {
      return {
        status: "queued",
        message: `Figma action "${action.label}" is ready for OAuth-backed execution.`
      };
    }
  };
}
