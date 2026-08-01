// Parser da entrada manual — o modo PADRÃO e SEGURO do MVP.
//
// O usuário pode:
//  (a) preencher campo a campo no formulário -> já chega estruturado; ou
//  (b) colar um texto único (ex: copiado do perfil ou do PDF exportado)
//      -> tentamos separar as seções por palavras-chave conhecidas.
//
// Este parser é "best effort": se não conseguir separar, guarda tudo em `raw`
// e o próprio LLM cuida de interpretar. Nunca lança erro por texto estranho.

import type { ProfileInput } from "@/lib/types";

/** Cabeçalhos que o LinkedIn (PT e EN) usa para cada seção. */
const SECTION_MARKERS: { field: keyof ProfileInput; labels: string[] }[] = [
  { field: "about", labels: ["sobre", "about"] },
  { field: "experience", labels: ["experiência", "experiencia", "experience"] },
  { field: "skills", labels: ["competências", "competencias", "skills", "aptidões"] },
];

/**
 * Limpa e normaliza os campos vindos do formulário. Também remove espaços
 * extras e garante que strings vazias virem undefined.
 */
export function normalizeManualInput(input: ProfileInput): ProfileInput {
  const clean = (v?: string) => {
    const t = (v ?? "").trim();
    return t.length > 0 ? t : undefined;
  };

  return {
    name: clean(input.name),
    headline: clean(input.headline),
    about: clean(input.about),
    experience: clean(input.experience),
    skills: clean(input.skills),
    raw: clean(input.raw),
  };
}

/**
 * Tenta quebrar um texto colado inteiro em seções, procurando os cabeçalhos.
 * O que vier antes do primeiro cabeçalho conhecido é tratado como headline.
 */
export function parsePastedText(text: string): ProfileInput {
  const result: ProfileInput = { raw: text.trim() };
  const lines = text.split(/\r?\n/);

  let current: keyof ProfileInput | "headline" = "headline";
  const buffers: Record<string, string[]> = {};

  for (const line of lines) {
    const lower = line.trim().toLowerCase();

    // A linha é um cabeçalho de seção? (linha curta que bate com um marcador)
    const marker = SECTION_MARKERS.find(
      (m) => lower.length <= 30 && m.labels.some((l) => lower === l || lower.startsWith(l))
    );

    if (marker) {
      current = marker.field;
      continue;
    }

    (buffers[current] ??= []).push(line);
  }

  // headline = primeira linha não vazia do bloco inicial.
  const headlineBlock = (buffers.headline ?? []).map((l) => l.trim()).filter(Boolean);
  if (headlineBlock.length > 0) result.headline = headlineBlock[0];

  const join = (key: string) => {
    const v = (buffers[key] ?? []).join("\n").trim();
    return v.length > 0 ? v : undefined;
  };

  result.about = join("about");
  result.experience = join("experience");
  result.skills = join("skills");

  return normalizeManualInput(result);
}

/**
 * Valida se há conteúdo mínimo para valer a pena analisar.
 * Retorna uma mensagem de erro (string) ou null se estiver ok.
 */
export function validateInput(input: ProfileInput): string | null {
  const hasAnything =
    input.raw ||
    input.headline ||
    input.about ||
    input.experience ||
    input.skills;

  if (!hasAnything) {
    return "Cole ao menos a headline e o 'Sobre' do perfil para analisar.";
  }
  return null;
}
