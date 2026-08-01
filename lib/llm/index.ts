// Camada de abstração de LLM.
//
// O resto da aplicação chama SEMPRE `analyzeProfile(profile)` e não precisa
// saber qual provider está por trás. A escolha do provider principal vem da
// env var LLM_PROVIDER. Se o principal falhar (erro/rate limit/timeout),
// tentamos automaticamente o outro antes de devolver erro ao usuário.

import type { AnalysisResult, LLMProviderName, ProfileInput } from "@/lib/types";
import { analyzeWithProviderA } from "./providerA";
import { analyzeWithProviderB } from "./providerB";

/** Mapa nome -> implementação. Facilita adicionar um provider C no futuro. */
const PROVIDERS: Record<
  LLMProviderName,
  (profile: ProfileInput) => Promise<AnalysisResult>
> = {
  providerA: analyzeWithProviderA,
  providerB: analyzeWithProviderB,
};

/** Lê o provider principal da env; default = providerA (Gemini). */
function getPrimaryProvider(): LLMProviderName {
  const fromEnv = process.env.LLM_PROVIDER;
  return fromEnv === "providerB" ? "providerB" : "providerA";
}

/** Resultado enriquecido com metadados de qual provider respondeu. */
export interface AnalyzeOutcome {
  result: AnalysisResult;
  /** Qual provider efetivamente gerou a análise. */
  providerUsed: LLMProviderName;
  /** True se o principal falhou e caímos no fallback. */
  usedFallback: boolean;
}

/**
 * Ponto de entrada único. Tenta o provider principal e, se falhar,
 * cai para o secundário automaticamente.
 */
export async function analyzeProfile(
  profile: ProfileInput
): Promise<AnalyzeOutcome> {
  const primary = getPrimaryProvider();
  const secondary: LLMProviderName =
    primary === "providerA" ? "providerB" : "providerA";

  try {
    const result = await PROVIDERS[primary](profile);
    return { result, providerUsed: primary, usedFallback: false };
  } catch (primaryError) {
    console.error(`[LLM] Provider principal (${primary}) falhou:`, primaryError);

    try {
      const result = await PROVIDERS[secondary](profile);
      return { result, providerUsed: secondary, usedFallback: true };
    } catch (secondaryError) {
      console.error(
        `[LLM] Fallback (${secondary}) também falhou:`,
        secondaryError
      );
      // Os dois falharam — deixa o chamador (API route) decidir o HTTP status.
      throw new Error(
        "Ambos os providers de LLM falharam. Verifique as chaves de API e tente novamente."
      );
    }
  }
}
