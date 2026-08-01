// Tipos compartilhados de toda a aplicação.
// Ficam separados para o frontend, as API routes e a camada de LLM
// usarem exatamente o mesmo formato de dados.

/** Dados de entrada de um perfil, vindos do formulário ou do PDF. */
export interface ProfileInput {
  /** Nome (opcional, só para deixar o relatório mais pessoal). */
  name?: string;
  /** Título/headline do perfil (o texto abaixo do nome). */
  headline?: string;
  /** Seção "Sobre" / About. */
  about?: string;
  /** Experiências profissionais, como texto corrido. */
  experience?: string;
  /** Competências / Skills, separadas por vírgula ou linha. */
  skills?: string;
  /**
   * Texto bruto colado inteiro (fallback). Se o usuário colar tudo de uma vez
   * em vez de preencher campo a campo, guardamos aqui.
   */
  raw?: string;
}

/** Avaliação de UMA seção do perfil (headline, about, etc.). */
export interface SectionScore {
  /**
   * Se a seção foi de fato avaliada. Fica `false` quando não havia dados
   * (ex: "Em destaque" não vem no PDF do LinkedIn). Seções não avaliadas
   * NÃO entram no cálculo da nota geral e aparecem como "N/A" no relatório.
   */
  evaluated: boolean;
  /** Nota de 0 a 10 daquela seção (ignorada quando evaluated=false). */
  score: number;
  /** Pontos fortes identificados. */
  strengths: string[];
  /** Problemas / pontos a melhorar. */
  issues: string[];
  /** Sugestão de texto reescrito, em português. */
  suggestionPT: string;
  /** Sugestão de texto reescrito, em inglês. */
  suggestionEN: string;
}

/** Nomes das seções avaliadas. Mantém tudo tipado e consistente. */
export type SectionKey =
  | "headline"
  | "about"
  | "experience"
  | "completeness"
  | "seo";

/** Checklist de itens objetivos (marcados como true/false pelo modelo). */
export interface Checklist {
  openToWork: boolean;
  keywordsInHeadline: boolean;
  fivePlusSkills: boolean;
  hasAbout: boolean;
  quantifiedResults: boolean;
  [key: string]: boolean; // permite o modelo adicionar itens extras
}

/** Resultado completo de uma análise — é o que vira JSON no banco. */
export interface AnalysisResult {
  /** Nota geral de 0 a 100. */
  overallScore: number;
  /** Uma avaliação por seção. */
  sections: Record<SectionKey, SectionScore>;
  /** Checklist de itens objetivos. */
  checklist: Checklist;
}

/** Nome do provider de LLM escolhido. */
export type LLMProviderName = "providerA" | "providerB";
