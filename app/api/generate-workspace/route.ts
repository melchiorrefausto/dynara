import { generateWorkspaceSchema } from "@/lib/ai/generateWorkspace";
import type { AdapterPrimitive } from "@/types/workspace";

export async function POST(request: Request) {
  const { prompt, primitives } = (await request.json()) as {
    prompt?: string;
    primitives?: AdapterPrimitive[];
  };

  const schema = await generateWorkspaceSchema(prompt ?? "", primitives ?? []);
  return Response.json({ schema });
}
