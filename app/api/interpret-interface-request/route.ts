import type { InterfacePlan } from "@/browser-extension/src/shared/manifest";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

type RequestBody = {
  prompt?: string;
  manifest?: {
    profiles?: Array<{ id: string; label: string; description?: string }>;
    views?: Array<{ id: string; label: string }>;
    actions?: Array<{ id: string; label: string; description?: string }>;
    designSystem?: { tokens?: Array<{ id: string; mutable?: boolean }> };
  };
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  const { prompt = "", manifest } = (await request.json()) as RequestBody;
  const plan = createHeuristicPlan(prompt, manifest);
  return Response.json({ plan }, { headers: CORS });
}

function createHeuristicPlan(prompt: string, manifest: RequestBody["manifest"]): InterfacePlan {
  const text = prompt.toLowerCase();
  const profiles = new Set((manifest?.profiles ?? []).map((profile) => profile.id));
  const views = new Set((manifest?.views ?? []).map((view) => view.id));
  const actions = new Set((manifest?.actions ?? []).map((action) => action.id));
  const mutableTokens = new Set((manifest?.designSystem?.tokens ?? []).filter((token) => token.mutable).map((token) => token.id));

	  const wantsMinimal = /\b(minimal|simple|clean|focus|content|less|remove|hide)\b/.test(text);
	  const wantsReading = /\b(read|reading|article|document|focus mode|comfortable)\b/.test(text);
	  const wantsCompact = /\b(compact|dense|dashboard|scanning|faster)\b/.test(text);
	  const wantsSpacious = /\b(spacious|premium|presentation|big|large|breathing|room)\b/.test(text);
	  const wantsHero = /\b(hero|headline|landing|above the fold|first screen|homepage|home page)\b/.test(text);
	  const wantsShowcase = /\b(showcase|premium|dramatic|bold|big|landing|campaign|marketing)\b/.test(text);
	  const wantsOcean = /\b(blue|ocean|cyan|teal|cool)\b/.test(text);
	  const wantsMono = /\b(mono|monochrome|gray|grey|black|neutral)\b/.test(text);
	  const wantsSunset = /\b(warm|orange|red|sunset|pink)\b/.test(text);
	  const wantsContrast = /\b(contrast|accessible|accessibility|readable)\b/.test(text);

  const tokenOverrides: Record<string, string> = {};
  const actionIds: string[] = [];
  let profileId: string | undefined;
  let viewId: string | undefined;
  let title = "Custom interface";

	  if (wantsHero && wantsShowcase && profiles.has("hero-showcase")) {
	    profileId = "hero-showcase";
	    title = "Hero showcase";
	  } else if (wantsHero && wantsCompact && profiles.has("hero-compact")) {
	    profileId = "hero-compact";
	    title = "Compact hero";
	  } else if (wantsOcean && profiles.has("ocean-theme")) {
	    profileId = "ocean-theme";
	    title = "Ocean interface";
  } else if (wantsMono && profiles.has("mono-compact")) {
    profileId = "mono-compact";
    title = "Mono compact interface";
  } else if (wantsSunset && profiles.has("sunset-spacious")) {
    profileId = "sunset-spacious";
    title = "Sunset spacious interface";
  } else if (wantsReading && profiles.has("reading-mode")) {
    profileId = "reading-mode";
    title = "Reading interface";
  } else if (wantsMinimal && profiles.has("content-focus")) {
    profileId = "content-focus";
    title = "Content-first interface";
  } else if (wantsSpacious && profiles.has("sunset-spacious")) {
    profileId = "sunset-spacious";
    title = "Spacious interface";
  } else if (wantsCompact && profiles.has("mono-compact")) {
    profileId = "mono-compact";
    title = "Compact interface";
  }

  if (!profileId) {
	    if (wantsHero && views.has("hero-focus")) viewId = "hero-focus";
	    else if (wantsMinimal && views.has("minimal")) viewId = "minimal";
	    else if (wantsReading && views.has("reading")) viewId = "reading";
	    else if (wantsMinimal && views.has("focus-content")) viewId = "focus-content";
	  }

	  if (wantsHero && wantsShowcase && actions.has("hero-showcase")) actionIds.push("hero-showcase");
	  if (wantsHero && wantsCompact && actions.has("hero-compact")) actionIds.push("hero-compact");
	  if (wantsHero && wantsMinimal && actions.has("hero-clean")) actionIds.push("hero-clean");
	  if (wantsOcean && actions.has("theme-ocean")) actionIds.push("theme-ocean");
  if (wantsMono && actions.has("theme-mono")) actionIds.push("theme-mono");
  if (wantsSunset && actions.has("theme-sunset")) actionIds.push("theme-sunset");
  if ((wantsReading || wantsMinimal) && actions.has("reading-width")) actionIds.push("reading-width");
  if ((wantsReading || wantsSpacious) && actions.has("reading-large-text")) actionIds.push("reading-large-text");
  if (wantsContrast && actions.has("high-contrast")) actionIds.push("high-contrast");

  if (!profileId && !viewId && actionIds.length === 0) {
    if (profiles.has("content-focus")) profileId = "content-focus";
    else if (views.has("focus-content")) viewId = "focus-content";
  }

  if (wantsOcean) assignAllowed(tokenOverrides, mutableTokens, {
    "color-background": "190 60% 97%",
    "color-foreground": "200 56% 14%",
    "color-accent": "176 72% 38%"
  });
  if (wantsMono) assignAllowed(tokenOverrides, mutableTokens, {
    "color-background": "0 0% 98%",
    "color-foreground": "0 0% 6%",
    "color-accent": "0 0% 16%"
  });
  if (wantsSunset) assignAllowed(tokenOverrides, mutableTokens, {
    "color-background": "34 70% 97%",
    "color-foreground": "18 50% 14%",
    "color-accent": "24 95% 53%"
  });

  return {
    title,
    summary: "Dynara can apply this using declared profiles, views, actions, and mutable design tokens.",
    profileId,
    viewId,
    tokenOverrides,
    actionIds: [...new Set(actionIds)],
    save: /\b(save|remember|always|keep|default)\b/.test(text)
  };
}

function assignAllowed(target: Record<string, string>, allowed: Set<string>, values: Record<string, string>) {
  for (const [key, value] of Object.entries(values)) {
    if (allowed.has(key)) target[key] = value;
  }
}
