// Feature flags. Duas fontes, nesta ordem de prioridade:
//  1. env vars (ENABLE_SCRAPING / ENABLE_PAYMENTS) — o jeito simples do MVP.
//  2. tabela feature_flags no Supabase — permite ligar/desligar em runtime.
//
// No MVP basta a env var. A leitura do banco fica pronta para o futuro.

import { getSupabaseAdmin } from "@/lib/db/client";

export type FeatureKey = "scraping" | "payments";

/** Lê a flag a partir da env var (fonte simples e sempre disponível). */
function fromEnv(key: FeatureKey): boolean {
  const raw =
    key === "scraping"
      ? process.env.ENABLE_SCRAPING
      : process.env.ENABLE_PAYMENTS;
  return raw === "true" || raw === "1";
}

/**
 * Versão síncrona (só env). Use em código que não pode fazer await,
 * como checagens rápidas no servidor.
 */
export function isEnabledSync(key: FeatureKey): boolean {
  return fromEnv(key);
}

/**
 * Versão async: tenta o banco primeiro (runtime), cai para a env se o banco
 * não estiver configurado ou não tiver a chave.
 */
export async function isEnabled(key: FeatureKey): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("feature_flags")
      .select("enabled")
      .eq("key", key)
      .maybeSingle();
    if (!error && data) return Boolean(data.enabled);
  }
  return fromEnv(key);
}
