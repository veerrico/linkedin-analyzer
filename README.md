# Analisador de Perfil do LinkedIn com IA (MVP)

Serviço web onde o usuário fornece os dados de um perfil do LinkedIn (colando o
texto ou preenchendo campos) e recebe um relatório com **notas por seção** e
**sugestões de melhoria** geradas por LLM — no estilo do [scoresu.me](https://scoresu.me/).

## Stack

- **Next.js 14** (App Router) + **Tailwind** + **TypeScript**
- **API routes** do próprio Next.js (serverless na Vercel)
- **Supabase** (Postgres) — opcional no começo
- **LLM** com 2 providers e fallback automático:
  - Provider A = **Google Gemini** (free tier)
  - Provider B = **NVIDIA NIM** (free tier)

## Como rodar localmente

1. Instale as dependências (só na primeira vez):
   ```bash
   npm install
   ```
2. Crie o `.env.local` e preencha **ao menos uma** chave de LLM:
   ```bash
   Copy-Item .env.local.example .env.local
   ```
   - Gemini: https://aistudio.google.com/apikey
   - NVIDIA: https://build.nvidia.com
3. Suba o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Abra http://localhost:3000

> Sem Supabase o app já funciona: o resultado é guardado no `sessionStorage`
> do navegador. Configure o Supabase depois para persistir as análises.

## Banco de dados (Supabase)

Rode o conteúdo de [`lib/db/schema.sql`](lib/db/schema.sql) no SQL Editor do
Supabase e preencha as três variáveis `*_SUPABASE_*` no `.env.local`.

## Estrutura

```
app/
  page.tsx                  landing + formulário de entrada
  analysis/[id]/page.tsx     relatório (score, radar, checklist, cards)
  api/analyze/route.ts       recebe o perfil, chama o LLM, salva no banco
  api/analysis/[id]/route.ts busca uma análise salva
  api/reanalyze/route.ts     stub (feature desligada)
  api/checkout/route.ts      stub de pagamento (501, feature desligada)
lib/
  llm/                       abstração + Gemini + NVIDIA + fallback + prompts
  scraping/                  entrada manual (padrão) + scraper (desligado)
  db/                        schema.sql + client Supabase
  featureFlags.ts            flags de scraping/pagamentos
components/                  ScoreRadarChart, SectionCard, SuggestionBox, PaywallGate
```

## Feature flags (todas desligadas no MVP)

| Flag | Env var | Padrão |
|------|---------|--------|
| Scraping do LinkedIn | `ENABLE_SCRAPING` | `false` |
| Pagamentos | `ENABLE_PAYMENTS` | `false` |

⚠️ **Scraping**: use apenas localmente, no seu próprio perfil. Fazer scraping do
LinkedIn pode violar os Termos de Uso. O Playwright nem é instalado por padrão.

## Deploy (Vercel)

1. Suba o repositório no GitHub.
2. Importe na Vercel, adicione as mesmas variáveis do `.env.local` em
   *Settings → Environment Variables*.
3. Deploy. As API routes viram serverless functions automaticamente.
