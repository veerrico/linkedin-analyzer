// ⚠️ MÓDULO DE SCRAPING — DESLIGADO POR PADRÃO (ENABLE_SCRAPING=false).
//
// AVISO IMPORTANTE / RISCO LEGAL:
// Fazer scraping do LinkedIn PODE VIOLAR os Termos de Uso da plataforma e
// resultar em bloqueio da sua conta. Este módulo existe apenas para uso
// LOCAL / DEV, lendo o SEU PRÓPRIO perfil com a SUA sessão logada.
//   - NÃO use para coletar perfis de terceiros.
//   - NÃO rode isso em produção / hospedado publicamente.
//   - NÃO colete em escala.
//
// Por isso o Playwright NÃO é dependência do projeto. Para ativar de verdade,
// você instala localmente:  npm install -D playwright  &&  npx playwright install
// e implementa a leitura do HTML. O stub abaixo deixa a "forma" pronta.

import type { ProfileInput } from "@/lib/types";
import { isEnabled } from "@/lib/featureFlags";

export interface ScrapeOptions {
  /** URL do próprio perfil (ex: https://www.linkedin.com/in/seu-usuario/). */
  profileUrl: string;
}

/**
 * Stub de scraping. Só roda se a feature flag `scraping` estiver ligada.
 * Enquanto não implementado, lança um erro claro para o desenvolvedor.
 */
export async function scrapeLinkedinProfile(
  options: ScrapeOptions
): Promise<ProfileInput> {
  const enabled = await isEnabled("scraping");
  if (!enabled) {
    throw new Error(
      "Scraping está desligado (ENABLE_SCRAPING=false). Use a entrada manual."
    );
  }

  // Valida a URL do próprio perfil antes de qualquer coisa.
  if (!options.profileUrl?.includes("linkedin.com/in/")) {
    throw new Error("profileUrl inválida: informe a URL do seu perfil LinkedIn.");
  }

  // TODO (uso local/dev apenas):
  // 1. const { chromium } = await import("playwright");
  // 2. Abrir com um userDataDir persistente para reaproveitar a sessão logada.
  // 3. page.goto(profileUrl, { waitUntil: "networkidle" }).
  // 4. Extrair textos por seletor/aria-label e montar o ProfileInput.
  // 5. await browser.close().
  //
  // Import dinâmico garante que o build de produção NUNCA tente carregar o
  // Playwright (que nem está instalado no deploy).
  throw new Error(
    "linkedinScraper: implementação de scraping não incluída no MVP. " +
      "Instale o Playwright localmente e preencha este stub para usar em dev."
  );
}
