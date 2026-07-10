import { suggestIntegrationFromFiles, type SourceFile } from "@/lib/ai/suggestPanels";
import { getAuthedClient } from "@/lib/supabase/auth";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type"
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  const auth = await getAuthedClient(request, CORS);
  if ("response" in auth) return auth.response;

  const { files } = (await request.json().catch(() => ({}))) as { files?: SourceFile[] };

  if (!Array.isArray(files) || files.length === 0) {
    return Response.json({ error: "Provide at least one file." }, { status: 400, headers: CORS });
  }

  const suggestions = await suggestIntegrationFromFiles(files);
  return Response.json(suggestions, { headers: CORS });
}
