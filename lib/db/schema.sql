-- Schema do Supabase / Postgres para o Analisador de Perfil LinkedIn.
-- Rode este arquivo no SQL Editor do Supabase (ou via migration).
-- Tudo é idempotente: pode rodar de novo sem quebrar.

-- Extensão para gerar UUIDs (já vem habilitada no Supabase, mas garantimos).
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: cada envio de dados de perfil pelo usuário.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key default gen_random_uuid(),
  raw_input   jsonb not null,          -- o ProfileInput cru que o usuário mandou
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- analyses: o resultado gerado pelo LLM para um profile.
-- ---------------------------------------------------------------------------
create table if not exists public.analyses (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references public.profiles(id) on delete cascade,
  overall_score  int not null,
  percentile     int,                  -- posição relativa (calculado depois)
  sections       jsonb not null,       -- AnalysisResult.sections
  checklist      jsonb not null,       -- AnalysisResult.checklist
  provider_used  text,                 -- "providerA" | "providerB" (auditoria)
  created_at     timestamptz not null default now()
);

create index if not exists analyses_profile_id_idx on public.analyses(profile_id);

-- ---------------------------------------------------------------------------
-- users: opcional no MVP. Pode usar Supabase Auth no lugar.
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  email       text unique,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- payments: TABELA CRIADA, mas o fluxo NÃO é implementado no MVP.
-- Fica pronta para quando ENABLE_PAYMENTS=true.
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.users(id) on delete set null,
  analysis_id  uuid references public.analyses(id) on delete set null,
  amount       numeric(10,2) not null default 0,
  status       text not null default 'pending', -- pending | paid | failed | refunded
  provider     text,                              -- gateway de pagamento (a decidir)
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- feature_flags: controla scraping e pagamentos em runtime, sem redeploy.
-- ---------------------------------------------------------------------------
create table if not exists public.feature_flags (
  key      text primary key,
  enabled  boolean not null default false
);

-- Valores iniciais (ambos desligados por padrão, como manda a spec).
insert into public.feature_flags (key, enabled) values
  ('scraping', false),
  ('payments', false)
on conflict (key) do nothing;
