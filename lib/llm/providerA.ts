// Provider A = Google Gemini (API "Generative Language", free tier).
// Usa a REST API direta com fetch para não depender de SDK extra.
// Docs: https://ai.google.dev/api/generate-content

import type { AnalysisResult, ProfileInput } from "@/lib/types";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import { parseAnalysis } from "./parse";

const DEFAULT_MODEL = "gemini-1.5-flash";

export async function analyzeWithProviderA(
  profile: ProfileInput
): Promise<AnalysisResult> {
  const apiKey = process.env.PROVIDER_A_API_KEY;
  if (!apiKey) {
    throw new Error("PROVIDER_A_API_KEY (Gemini) não configurada.");
  }
  const model = process.env.PROVIDER_A_MODEL || DEFAULT_MODEL;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: buildUserPrompt(profile) }] }],
      generationConfig: {
        temperature: 0.4,
        // Força o modelo a devolver JSON puro (recurso nativo do Gemini).
        responseMimeType: "application/json",
      },
    }),
    // Evita requisições penduradas para sempre.
    signal: AbortSignal.timeout(45_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini falhou (HTTP ${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini retornou uma resposta vazia.");
  }

  return parseAnalysis(text);
}
