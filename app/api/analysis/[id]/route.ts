// GET /api/analysis/[id]
// Busca uma análise salva no Supabase pelo id. Usado pela página de relatório
// quando o resultado não está no sessionStorage (ex: link compartilhado).

import { NextResponse } from "next/server";
import type { AnalysisResult } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Banco de dados não configurado." },
      { status: 503 }
    );
  }

  const { data, error } = await supabase
    .from("analyses")
    .select("id, overall_score, percentile, sections, checklist, provider_used, created_at")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Análise não encontrada." }, { status: 404 });
  }

  const result: AnalysisResult = {
    overallScore: data.overall_score,
    sections: data.sections,
    checklist: data.checklist,
  };

  return NextResponse.json({ id: data.id, result, providerUsed: data.provider_used });
}
