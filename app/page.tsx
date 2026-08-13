"use client";

// Landing page — entrada única por UPLOAD DE PDF do LinkedIn.
// O usuário exporta o PDF do próprio perfil ("Mais → Salvar como PDF"),
// solta aqui e recebe a análise. Ao enviar, chamamos /api/analyze,
// guardamos o resultado no sessionStorage e vamos para /analysis/[id].

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import PixDonation from "@/components/PixDonation";

export default function HomePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPix, setShowPix] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Cronômetro: enquanto está analisando, incrementa 1s por vez.
  useEffect(() => {
    if (!loading) return;
    setElapsed(0);
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [loading]);

  // Valida e seleciona um arquivo (usado tanto no clique quanto no arrastar).
  function pickFile(f: File | null) {
    if (!f) return;
    const isPdf =
      f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Envie um arquivo PDF (o exportado pelo LinkedIn).");
      return;
    }
    setError(null);
    setFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Selecione o PDF exportado do seu LinkedIn.");
      return;
    }

    setLoading(true);
    try {
      // multipart/form-data — não setar Content-Type na mão (o browser cuida
      // do boundary). O backend extrai o texto do PDF e chama o LLM.
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Falha ao analisar o perfil.");
        return;
      }

      // Métrica: conta uma análise concluída com sucesso (Vercel Analytics).
      track("analise_concluida", { provider: data.providerUsed ?? "desconhecido" });

      sessionStorage.setItem(`analysis:${data.id}`, JSON.stringify(data));
      router.push(`/analysis/${data.id}`);
    } catch {
      setError("Erro de rede. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Analisador de Perfil do LinkedIn
        </h1>
        <p className="mt-3 text-gray-600">
          Envie o PDF do seu perfil e receba notas por seção + sugestões de
          melhoria geradas por IA.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Passo a passo (caixa azul) */}
        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          <p className="mb-2 font-semibold">
            Como baixar seu PDF no LinkedIn (leva ~10s):
          </p>
          <ol className="space-y-1">
            <li>
              <strong>1.</strong> Abra o seu perfil no LinkedIn
              (linkedin.com/in/seu-nome).
            </li>
            <li>
              <strong>2.</strong> Clique no botão <strong>Mais</strong> (•••),
              logo abaixo da foto de capa.
            </li>
            <li>
              <strong>3.</strong> Escolha <strong>Salvar como PDF</strong> — o
              download começa na hora.
            </li>
            <li>
              <strong>4.</strong> Solte o arquivo baixado na área abaixo.
            </li>
          </ol>
        </div>

        {/* Área de upload (clique OU arrastar-e-soltar) */}
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragActive(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            pickFile(e.dataTransfer.files?.[0] ?? null);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
            dragActive
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50"
          }`}
        >
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <span className="text-sm font-medium text-indigo-700">
              📄 {file.name}
            </span>
          ) : (
            <span className="text-sm text-gray-500">
              {dragActive
                ? "Solte o arquivo para anexar"
                : "Clique para escolher o PDF ou arraste-o aqui"}
            </span>
          )}
        </label>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Analisando com IA... {elapsed}s
            </>
          ) : (
            "Analisar meu perfil"
          )}
        </button>

        {loading && (
          <p className="text-center text-xs text-gray-500">
            A IA está lendo seu perfil — isso costuma levar de 20 a 40 segundos.
            Não feche esta página. ⏳
          </p>
        )}
      </form>

      <p className="mx-auto mt-6 max-w-xl text-center text-xs text-gray-400">
        Ferramenta que analisa seu perfil e sugere melhorias de texto e SEO para
        você ser mais encontrado por recrutadores nas buscas do LinkedIn. Seus
        dados são processados pela API de IA apenas para gerar a análise e, em
        seguida, descartados.
      </p>

      {/* Apoio ao projeto (discreto, expande o bloco de doação PIX) */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => setShowPix((v) => !v)}
          className="text-xs font-medium text-emerald-700 hover:underline"
        >
          💙 Apoiar o projeto
        </button>
      </div>
      {showPix && <PixDonation />}
    </main>
  );
}
