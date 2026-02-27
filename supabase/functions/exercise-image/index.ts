import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ExerciseDbItem = {
  id?: string | number;
  name?: string;
  gifUrl?: string;
  gifurl?: string;
  gifURL?: string;
  equipment?: string;
  bodyPart?: string;
  target?: string;
};

const STOP_WORDS = new Set(["the", "a", "an", "with", "and", "or", "for", "to", "on", "in", "at", "of"]);
const EQUIPMENT_KEYWORDS = ["dumbbell", "barbell", "kettlebell", "cable", "machine", "band", "resistance", "bodyweight", "body weight", "trx"];
const MOVEMENT_KEYWORDS = ["curl", "press", "squat", "lunge", "deadlift", "row", "raise", "extension", "fly", "plank", "crunch", "pulldown", "kickback", "bridge"];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value: string) =>
  normalize(value)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

const extractEquipment = (value: string) => {
  const n = normalize(value);
  return EQUIPMENT_KEYWORDS.find((key) => n.includes(key)) || null;
};

const extractMovement = (value: string) => {
  const n = normalize(value);
  return MOVEMENT_KEYWORDS.find((key) => n.includes(key)) || null;
};

const extractGifUrl = (candidate?: ExerciseDbItem | null) => {
  const raw = candidate?.gifUrl || candidate?.gifurl || candidate?.gifURL || null;
  if (!raw) return null;
  return raw.startsWith("http://") ? raw.replace("http://", "https://") : raw;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};

async function fetchGifById(apiKey: string, exerciseId: string): Promise<string | null> {
  if (!exerciseId) return null;

  const url = `https://exercisedb.p.rapidapi.com/image?exerciseId=${encodeURIComponent(exerciseId)}&resolution=360`;
  const res = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
    },
  });

  if (!res.ok) return null;
  const contentType = res.headers.get("content-type") || "image/gif";
  const buffer = await res.arrayBuffer();
  if (!buffer.byteLength) return null;

  return `data:${contentType};base64,${arrayBufferToBase64(buffer)}`;
}

function scoreCandidate(inputName: string, candidate: ExerciseDbItem): number {
  const candidateName = normalize(candidate.name || "");
  const inputNorm = normalize(inputName);
  if (!candidateName) return Number.NEGATIVE_INFINITY;

  let score = 0;

  if (candidateName === inputNorm) score += 140;
  if (candidateName.includes(inputNorm) || inputNorm.includes(candidateName)) score += 80;

  const inputTokens = new Set(tokenize(inputName));
  const candidateTokens = new Set(tokenize(candidateName));
  let overlap = 0;
  inputTokens.forEach((t) => {
    if (candidateTokens.has(t)) overlap += 1;
  });
  score += overlap * 18;

  const inputEquipment = extractEquipment(inputName);
  const candidateEquipment = extractEquipment(candidate.equipment || candidateName);
  if (inputEquipment && candidateEquipment && inputEquipment === candidateEquipment) score += 45;
  if (inputEquipment && candidateEquipment && inputEquipment !== candidateEquipment) score -= 35;

  const inputMovement = extractMovement(inputName);
  const candidateMovement = extractMovement(candidateName);
  if (inputMovement && candidateMovement && inputMovement === candidateMovement) score += 28;

  const inputHasTargetHint = [candidate.target, candidate.bodyPart]
    .filter(Boolean)
    .some((hint) => inputNorm.includes(normalize(hint as string)));
  if (inputHasTargetHint) score += 12;

  return score;
}

async function callExerciseDb(apiKey: string, url: string): Promise<ExerciseDbItem[]> {
  const res = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
    },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function searchByName(apiKey: string, query: string): Promise<ExerciseDbItem[]> {
  if (!query) return [];
  const url = `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(query)}?limit=12&offset=0`;
  return callExerciseDb(apiKey, url);
}

async function searchAllExercises(apiKey: string): Promise<ExerciseDbItem[]> {
  const url = `https://exercisedb.p.rapidapi.com/exercises?limit=1500&offset=0`;
  return callExerciseDb(apiKey, url);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name } = await req.json();
    if (!name || typeof name !== "string") throw new Error("Exercise name is required");

    const apiKey = Deno.env.get("EXERCISEDB_API_KEY");
    if (!apiKey) throw new Error("EXERCISEDB_API_KEY not configured");

    const cleaned = normalize(name);
    const simplified = cleaned.split(" ").slice(0, 3).join(" ");
    const withoutEquipment = tokenize(cleaned)
      .filter((token) => !EQUIPMENT_KEYWORDS.includes(token))
      .join(" ");

    const [mainResults, simplifiedResults, noEquipmentResults] = await Promise.all([
      searchByName(apiKey, cleaned),
      searchByName(apiKey, simplified),
      searchByName(apiKey, withoutEquipment),
    ]);

    let merged = [...mainResults, ...simplifiedResults, ...noEquipmentResults];

    if (merged.length === 0) {
      merged = await searchAllExercises(apiKey);
    }

    const uniqueByName = Array.from(
      new Map(merged.filter((e) => e?.name).map((e) => [normalize(e.name as string), e])).values()
    );

    if (uniqueByName.length === 0) {
      return new Response(JSON.stringify({ gifUrl: null, name: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scored = uniqueByName
      .map((candidate) => ({ candidate, score: scoreCandidate(name, candidate) }))
      .sort((a, b) => b.score - a.score);

    const best = scored[0]?.candidate;
    let gifUrl = extractGifUrl(best);

    if (!gifUrl && best?.id) {
      gifUrl = await fetchGifById(apiKey, String(best.id));
    }

    console.log("exercise-image best-match", JSON.stringify({
      requestedName: name,
      matchedName: best?.name,
      matchedId: best?.id,
      matchedKeys: best ? Object.keys(best) : [],
      hasGifUrl: Boolean(gifUrl),
    }));

    return new Response(JSON.stringify({ gifUrl, name: best?.name || null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("exercise-image error:", e);
    return new Response(JSON.stringify({ gifUrl: null, error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
