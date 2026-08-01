// POST /api/reanalyze
// Reanálise de um perfil já existente. Feature ainda desligada no MVP.
// Deixamos o stub pronto para depois: buscar o profile pelo id e rodar de novo.

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  // TODO: quando a feature de reanálise entrar:
  //  1. receber { analysisId } no body;
  //  2. buscar o profile.raw_input original no Supabase;
  //  3. chamar analyzeProfile de novo;
  //  4. inserir uma nova linha em `analyses` (mantendo histórico).
  return NextResponse.json(
    { error: "Reanálise ainda não implementada (feature desligada no MVP)." },
    { status: 501 }
  );
}
