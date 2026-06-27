import {
  aiSuggestions,
  brokenVariants,
  components,
  devHandoffStatus,
  documentationStatus,
  tokens
} from "@/lib/mock-data/figma";

export async function getComponents() {
  return components;
}

export async function getVariables() {
  return tokens;
}

export async function getTokens() {
  return tokens;
}

export async function getBrokenVariants() {
  return brokenVariants;
}

export async function getDocumentationStatus() {
  return documentationStatus;
}

export async function getDevHandoffStatus() {
  return devHandoffStatus;
}

export async function getAiSuggestions() {
  return aiSuggestions;
}

export async function runAction(actionId: string) {
  return {
    id: actionId,
    status: "queued",
    message: `Action ${actionId} has been queued for the Figma connector.`
  };
}
