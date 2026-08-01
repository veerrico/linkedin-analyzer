// Clientes do Supabase.
//
// São DOIS clientes diferentes de propósito:
//  - `supabaseAdmin`: usa a SERVICE_ROLE_KEY, só pode ser usado no SERVIDOR
//    (API routes). Ignora RLS, então NUNCA importe isso em código de cliente.
//  - `getSupabaseBrowser()`: usa a ANON_KEY, seguro para o navegador.
//
// No MVP as gravações acontecem só nas API routes, então usamos o admin lá.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Cliente de servidor (privilegiado). Só chame dentro de API routes / server
 * components. Retorna null se as envs não estiverem configuradas, para o app
 * não quebrar em dev antes de você conectar o Supabase.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Cliente de navegador (chave pública anon). Seguro para components client. */
export function getSupabaseBrowser(): SupabaseClient | null {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey);
}
