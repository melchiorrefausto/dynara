import { createFigmaConnector } from "@/lib/connectors/figma";
import type { Connector, ConnectorProvider } from "@/lib/connectors/types";

const connectors: Record<ConnectorProvider, Connector> = {
  figma: createFigmaConnector(),
  notion: createPlaceholderConnector("notion", "Notion"),
  linear: createPlaceholderConnector("linear", "Linear"),
  gmail: createPlaceholderConnector("gmail", "Gmail"),
  slack: createPlaceholderConnector("slack", "Slack")
};

export function getConnector(provider: ConnectorProvider) {
  return connectors[provider];
}

export function listConnectors() {
  return Object.values(connectors);
}

function createPlaceholderConnector(provider: ConnectorProvider, name: string): Connector {
  return {
    provider,
    name,
    async connect() {
      return { provider, name, status: "connected", lastSync: "just now", metadata: { auth: "pending-oauth" } };
    },
    async disconnect() {
      return { provider, name, status: "available" };
    },
    async getStatus() {
      return { provider, name, status: "available" };
    },
    async sync() {
      return { status: "queued", message: `${name} sync is ready for OAuth credentials.` };
    },
    async listPrimitives() {
      return [];
    },
    async runAction(action) {
      return { status: "queued", message: `${name} action "${action.label}" is ready for OAuth-backed execution.` };
    }
  };
}
