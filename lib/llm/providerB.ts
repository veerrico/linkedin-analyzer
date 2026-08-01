// Provider B = NVIDIA NIM (build.nvidia.com). A API é compatível com o formato
// da OpenAI (chat/completions), então o código é o padrão de mercado.
// Docs: https://docs.nvidia.com/nim/ — endpoint: https://integrate.api.nvidia.com/v1

import type { AnalysisResult, ProfileInput } from "@/lib/types";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import { parseAnalysis } from "./parse";

const DEFAULT_MODEL = "meta/llama-3.1-70b-instruct";
const ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";

export async function analyzeWithProviderB(
  profile: ProfileInput
): Promise<AnalysisResult> {
  const apiKey = process.env.PROVIDER_B_API_KEY;
  if (!apiKey) {
    throw new Error("PROVIDER_B_API_KEY (NVIDIA) não configurada.");
  }
  const model = process.env.PROVIDER_B_MODEL || DEFAULT_MODEL;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(profile) },
      ],
      temperature: 0.4,
      max_tokens: 2048,
      // Muitos modelos NIM aceitam json_object; se o modelo ignorar,
      // o parse.ts ainda extrai o JSON do texto.
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`NVIDIA falhou (HTTP ${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("NVIDIA retornou uma resposta vazia.");
  }

  return parseAnalysis(text);
}
