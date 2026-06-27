import { generateWorkspaceSchema } from "@/lib/ai/generateWorkspace";

export async function POST(request: Request) {
  const { prompt } = (await request.json()) as { prompt?: string };
  const schema = await generateWorkspaceSchema(prompt ?? "");

  return Response.json({ schema });
}
