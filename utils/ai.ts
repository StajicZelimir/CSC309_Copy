// utils/ai.ts
import fetch from "node-fetch";
import dotenv from "dotenv";
import { Console } from "console";

dotenv.config();

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    console.error("Failed to parse AI response:", text);
    throw new Error("Invalid JSON returned from AI model");
  }
}

function requireEnv(name: string) {
  const v = process.env[name];

  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function hfClassify(model: string, inputs: string[]) {
  const url = `https://router.huggingface.co/hf-inference/models/${model}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HF_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs, options: { wait_for_model: true } }),
  });

  const text = await resp.text();
  if (!resp.ok) throw new Error(`HF request failed (${resp.status}): ${text}`);

  const json = safeJsonParse(text);
  if (json?.error) throw new Error(`HF error: ${json.error}`);
  return json;
}

// Toxicity stays 0..1
export const TOX_VERDICT_THRESHOLD = 0.7; // >= => explanation
export const TOX_REPORT_THRESHOLD = 0.7;  // >  => report

type ToxicInput = { cid?: number; tid?: number; text: string };
type ToxicOutput = { cid?: number; tid?: number; toxic: number; verdict: string };

export async function runToxicityAll(items: ToxicInput[]): Promise<ToxicOutput[]> {
    if (items.length === 0) return [];
  
    const model = requireEnv("HF_TOX_MODEL");
    const texts = items.map((it) => String(it.text ?? ""));
    const hfOut = await hfClassify(model, texts);
  
    // HF Router returned: [ [ {label, score}, {label, score}, ... ] ]
    // We want: one entry per input.
    let perInput: any[] = [];
  
    if (Array.isArray(hfOut) && hfOut.length === 1 && Array.isArray(hfOut[0])) {
      perInput = hfOut[0];
    } else if (Array.isArray(hfOut)) {
      perInput = hfOut;
    } else {
      throw new Error("Unexpected HF toxicity response shape");
    }
  
    if (perInput.length !== items.length) {
      throw new Error(
        `HF toxicity length mismatch: inputs=${items.length} outputs=${perInput.length}`
      );
    }
  
    return perInput.map((x: any, idx: number) => {
      const label = String(x?.label ?? "").toLowerCase();
      const score = Number(x?.score ?? 0);
  
      // For this model, score already represents toxicity 0..1
      const toxic = Math.max(0, Math.min(1, score));
  
      const verdict =
        toxic >= TOX_VERDICT_THRESHOLD
          ? `High ${label.replaceAll("_", " ")}`
          : "Not Toxic";
  
      return {
        cid: items[idx].cid,
        tid: items[idx].tid,
        toxic,
        verdict,
      };
    });
  }

// =======================
// GO-EMOTIONS -> sentiment score (-5..+5)
// =======================
export async function runEmotionSentimentAll(
  items: Array<{ id: number; text: string }>
): Promise<Array<{ id: number; score: number }>> {

  if (items.length === 0) return [];

  const model = requireEnv("HF_EMO_MODEL");

  // Extract texts
  const texts = items.map((x) => String(x.text ?? ""));

  // Call HF classifier
  let hfOut = await hfClassify(model, texts);

  // Normalize output shape:
  // HF sometimes returns [ [all predictions] ] for multiple inputs
  if (!Array.isArray(hfOut)) throw new Error("Unexpected HF output shape");

  // If HF returned one array with all items, wrap each label in its own array
  if (hfOut.length === 1 && hfOut[0].length === items.length) {
    hfOut = hfOut[0].map((x: any) => [x]);
  }


  // Define POS/NEG sets
  const POS = new Set([
    "admiration","amusement","approval","caring","excitement","gratitude",
    "joy","love","optimism","pride","relief",
  ]);

  const NEG = new Set([
    "anger","annoyance","disappointment","disapproval","disgust","embarrassment",
    "fear","grief","nervousness","remorse","sadness",
  ]);

  // Compute score per comment
  function labelsToScore(labels: any[]): number {
    let pos = 0, neg = 0;
    for (const x of labels) {
      const label = String(x.label ?? "").toLowerCase();
      const score = Number(x.score ?? 0);
      if (POS.has(label)) pos += score;
      if (NEG.has(label)) neg += score;
    }
    const net = pos - neg;
    const scaled = Math.round(net * 5);
    if (Math.abs(scaled) <= 1) return 0;
    return Math.max(-5, Math.min(5, scaled));
  }

  // Map each HF output to the corresponding item id
  return hfOut.map((labels: any[], i: number) => ({
    id: items[i].id,
    score: labelsToScore(labels),
  }));
}