import { createFigmaConnector } from "@/lib/connectors/figma";
import type { Connector, ConnectorProvider } from "@/lib/connectors/types";

const connectors: Partial<Record<ConnectorProvider, Connector>> = {
  figma: createFigmaConnector()
};

export function getConnector(provider: ConnectorProvider) {
  const connector = connectors[provider];
  if (!connector) {
    throw new Error(`${provider} is not configured.`);
  }
  return connector;
}

export function listConnectors() {
  return Object.values(connectors).filter(Boolean) as Connector[];
}
