import { suggestPanelsFromFiles, type SourceFile } from "@/lib/ai/suggestPanels";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  const { files } = (await request.json()) as { files?: SourceFile[] };

  if (!Array.isArray(files) || files.length === 0) {
    return Response.json({ error: "Provide at least one file." }, { status: 400, headers: CORS });
  }

  const panels = await suggestPanelsFromFiles(files);
  return Response.json({ panels }, { headers: CORS });
}
