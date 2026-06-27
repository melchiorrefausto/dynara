import type { AdapterPrimitive, ConnectedApp, WorkspaceAction } from "@/types/workspace";

export type ConnectorProvider = "figma" | "notion" | "linear" | "gmail" | "slack";

export type ConnectorStatus = ConnectedApp["status"];

export type ConnectorConnection = {
  provider: ConnectorProvider;
  name: string;
  status: ConnectorStatus;
  lastSync?: string;
  metadata?: Record<string, string | number | boolean>;
};

export type ConnectorSyncResult = {
  status: "queued" | "running" | "completed" | "failed";
  message: string;
  primitives?: AdapterPrimitive[];
};

export type Connector = {
  provider: ConnectorProvider;
  name: string;
  connect(): Promise<ConnectorConnection>;
  disconnect(): Promise<ConnectorConnection>;
  getStatus(): Promise<ConnectorConnection>;
  sync(): Promise<ConnectorSyncResult>;
  listPrimitives(): Promise<AdapterPrimitive[]>;
  runAction(action: WorkspaceAction): Promise<ConnectorSyncResult>;
};
