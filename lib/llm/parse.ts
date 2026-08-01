// Utilitários para transformar a resposta em texto do LLM num AnalysisResult
// válido e tipado. Modelos às vezes "escorregam" e devolvem o JSON dentro de
// blocos de markdown (```json ... ```), então limpamos antes de dar parse.

import type { AnalysisResult, SectionKey } from "@/lib/types";

const SECTION_KEYS: SectionKey[] = [
  "headline",
  "about",
  "experience",
  "completeness",
  "seo",
];

/**
 * Pesos de cada seção na nota geral. Headline, Sobre e Experiência pesam mais.
 * A nota geral é a média ponderada APENAS das seções avaliadas.
 */
const SECTION_WEIGHTS: Record<SectionKey, number> = {
  headline: 2,
  about: 2,
  experience: 2,
  completeness: 1.5,
  seo: 1,
};

/** Remove crases/markdown e extrai o primeiro objeto JSON de um texto. */
export function extractJson(text: string): unknown {
  let cleaned = text.trim();

  // Remove cercas de código markdown, ex: ```json ... ``` ou ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();

  // Se ainda houver texto ao redor, pega do primeiro "{" até o último "}".
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    cleaned = cleaned.slice(first, last + 1);
  }

  return JSON.parse(cleaned);
}

/** Garante que um valor seja número dentro de um intervalo (senão usa fallback). */
function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Garante que um valor seja array de strings. */
function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v) => typeof v === "string");
}

/**
 * Recebe o JSON "cru" do modelo e devolve um AnalysisResult sempre no formato
 * correto, preenchendo defaults quando algo vier faltando. Assim o frontend
 * nunca quebra por causa de uma resposta malformada do LLM.
 */
export function normalizeResult(raw: unknown): AnalysisResult {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const rawSections = (obj.sections ?? {}) as Record<string, unknown>;
  const rawChecklist = (obj.checklist ?? {}) as Record<string, unknown>;

  const bool = (v: unknown) => v === true;

  const sections = {} as AnalysisResult["sections"];
  for (const key of SECTION_KEYS) {
    const s = (rawSections[key] ?? {}) as Record<string, unknown>;
    // Uma seção conta como avaliada se o modelo disse evaluated=true.
    // Se o campo vier ausente (modelos antigos), assumimos true por retrocompat.
    const evaluated = s.evaluated === undefined ? true : bool(s.evaluated);
    sections[key] = {
      evaluated,
      score: clampNumber(s.score, 0, 10, 0),
      strengths: toStringArray(s.strengths),
      issues: toStringArray(s.issues),
      suggestionPT: typeof s.suggestionPT === "string" ? s.suggestionPT : "",
      suggestionEN: typeof s.suggestionEN === "string" ? s.suggestionEN : "",
    };
  }

  return {
    // Recalculamos a nota geral aqui (determinístico e confiável), em vez de
    // confiar no número do modelo. Só entram as seções avaliadas.
    overallScore: computeOverallScore(sections),
    sections,
    checklist: {
      structuredHeadline: bool(rawChecklist.structuredHeadline),
      keywordsInHeadline: bool(rawChecklist.keywordsInHeadline),
      hasAbout: bool(rawChecklist.hasAbout),
      fivePlusSkills: bool(rawChecklist.fivePlusSkills),
      quantifiedResults: bool(rawChecklist.quantifiedResults),
      hasLocation: bool(rawChecklist.hasLocation),
      openToWork: bool(rawChecklist.openToWork),
    },
  };
}

/**
 * Nota geral (0-100) = média ponderada das seções AVALIADAS, vezes 10.
 * Seções não avaliadas (ex: "featured" ausente no PDF) são ignoradas para
 * não puxar a média injustamente. Se nada foi avaliado, retorna 0.
 */
export function computeOverallScore(
  sections: AnalysisResult["sections"]
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const key of SECTION_KEYS) {
    const section = sections[key];
    if (!section.evaluated) continue;
    weightedSum += section.score * SECTION_WEIGHTS[key];
    totalWeight += SECTION_WEIGHTS[key];
  }

  if (totalWeight === 0) return 0;
  return Math.round((weightedSum / totalWeight) * 10);
}

/** Atalho: limpa o texto do modelo e já devolve um AnalysisResult normalizado. */
export function parseAnalysis(text: string): AnalysisResult {
  return normalizeResult(extractJson(text));
}
