// POST /api/analyze
// Recebe os dados do perfil, chama o LLM (com fallback A<->B) e — se o
// Supabase estiver configurado — salva profile + analysis no banco.
// Sempre devolve { id, result } para o frontend renderizar o relatório.

import { NextResponse } from "next/server";
import type { ProfileInput } from "@/lib/types";
import { analyzeProfile } from "@/lib/llm";
import { normalizeManualInput, validateInput } from "@/lib/scraping/manualInput";
import { extractPdfText } from "@/lib/scraping/pdfInput";
import { getSupabaseAdmin } from "@/lib/db/client";

// Análise pode demorar; garante runtime Node (não Edge) e sem cache.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// O LLM pode levar ~30s. Vercel: sem isto, a função serverless corta em 10s.
// 60s é o máximo do plano Hobby (free).
export const maxDuration = 60;

/**
 * Lê o corpo da requisição em dois formatos:
 *  - multipart/form-data -> upload de PDF (campo "file");
 *  - application/json     -> entrada manual (campos) ou texto colado.
 */
async function readProfile(request: Request): Promise<ProfileInput> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new Error("Nenhum arquivo PDF enviado.");
    }
    const text = await extractPdfText(await file.arrayBuffer());
    return { raw: text };
  }

  return (await request.json()) as ProfileInput;
}

export async function POST(request: Request) {
  let body: ProfileInput;
  try {
    body = await readProfile(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Entrada inválida.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const profile = normalizeManualInput(body);

  const validationError = validateInput(profile);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // 1) Chama o LLM (já com fallback interno entre os dois providers).
  let outcome;
  try {
    outcome = await analyzeProfile(profile);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao analisar o perfil.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const { result, providerUsed, usedFallback } = outcome;

  // 2) Persiste no Supabase, se configurado. Se não, seguimos só com o
  //    sessionStorage do cliente (permite testar sem banco no MVP).
  const supabase = getSupabaseAdmin();
  let id = crypto.randomUUID();

  if (supabase) {
    try {
      const { data: profileRow, error: profileErr } = await supabase
        .from("profiles")
        .insert({ raw_input: profile })
        .select("id")
        .single();
      if (profileErr) throw profileErr;

      const { data: analysisRow, error: analysisErr } = await supabase
        .from("analyses")
        .insert({
          profile_id: profileRow.id,
          overall_score: result.overallScore,
          sections: result.sections,
          checklist: result.checklist,
          provider_used: providerUsed,
        })
        .select("id")
        .single();
      if (analysisErr) throw analysisErr;

      id = analysisRow.id;
    } catch (dbErr) {
      // Banco falhou? Não perde a análise — só loga e segue com id local.
      console.error("[analyze] Falha ao salvar no Supabase:", dbErr);
    }
  }

  return NextResponse.json({ id, result, providerUsed, usedFallback });
}
