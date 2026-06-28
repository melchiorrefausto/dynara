import { generateWorkspaceSchema } from "@/lib/ai/generateWorkspace";
import type { AdapterPrimitive } from "@/types/workspace";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  const { prompt, primitives } = (await request.json()) as {
    prompt?: string;
    primitives?: AdapterPrimitive[];
  };

  const schema = await generateWorkspaceSchema(prompt ?? "", primitives ?? []);
  return Response.json({ schema }, { headers: CORS });
}
