"use client";

// Página de relatório: score geral (medidor circular + faixa de qualidade),
// radar com nota por eixo, checklist em chips e cards por seção com sugestões.
//
// Dados: primeiro tenta o sessionStorage (resultado recém-gerado na home);
// se não achar (ex: link aberto direto), busca no backend.

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AnalysisResult, SectionKey } from "@/lib/types";
import ScoreRadarChart from "@/components/ScoreRadarChart";
import ScoreGauge from "@/components/ScoreGauge";
import SectionCard from "@/components/SectionCard";
import PaywallGate from "@/components/PaywallGate";
import PixDonation from "@/components/PixDonation";

interface AnalysisPayload {
  id: string;
  result: AnalysisResult;
  providerUsed?: string;
  usedFallback?: boolean;
}

const SECTION_TITLES: { key: SectionKey; title: string }[] = [
  { key: "headline", title: "Headline" },
  { key: "about", title: "Sobre (About)" },
  { key: "experience", title: "Experiência" },
  { key: "completeness", title: "Completude do perfil" },
  { key: "seo", title: "SEO / Palavras-chave" },
];

const CHECKLIST_LABELS: Record<string, string> = {
  structuredHeadline: "Headline no formato [Cargo] | [Especialidade] | [Resultado]",
  keywordsInHeadline: "Palavras-chave na headline",
  hasAbout: "Seção 'Sobre' preenchida",
  fivePlusSkills: "5 ou mais competências",
  quantifiedResults: "Resultados quantificados",
  hasLocation: "Localização (cidade/país) preenchida",
  openToWork: "Sinaliza abertura a oportunidades",
};

/** Faixas de qualidade da nota geral (0-100). */
const TIERS = [
  { min: 0, label: "Precisa de ajustes", color: "#dc2626" },
  { min: 55, label: "Razoável", color: "#f59e0b" },
  { min: 70, label: "Bom", color: "#65a30d" },
  { min: 85, label: "Excelente", color: "#16a34a" },
];

function tierFor(score: number) {
  let idx = 0;
  for (let i = 0; i < TIERS.length; i++) if (score >= TIERS[i].min) idx = i;
  return { ...TIERS[idx], index: idx };
}

const VERDICTS = [
  "Há bastante espaço para evoluir — as sugestões abaixo mostram por onde começar.",
  "Um bom começo. Ajustando os pontos destacados, seu perfil sobe de nível rápido.",
  "Perfil sólido e bem encaminhado. Faltam alguns retoques para chegar ao topo.",
  "Perfil altamente otimizado. Parabéns — mantenha atualizado e siga refinando.",
];

export default function AnalysisPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [payload, setPayload] = useState<AnalysisPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = sessionStorage.getItem(`analysis:${id}`);
    if (cached) {
      try {
        setPayload(JSON.parse(cached));
        setLoading(false);
        return;
      } catch {
        // cache corrompido -> segue para o fetch.
      }
    }

    fetch(`/api/analysis/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Análise não encontrada.");
        setPayload(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <CenteredMessage>Carregando análise...</CenteredMessage>;
  }

  if (error || !payload) {
    return (
      <CenteredMessage>
        <p className="text-red-600">{error || "Análise não encontrada."}</p>
        <Link href="/" className="mt-4 text-indigo-600 underline">
          Voltar e analisar outro perfil
        </Link>
      </CenteredMessage>
    );
  }

  const { result } = payload;
  const tier = tierFor(result.overallScore);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      {/* Barra de ações (não aparece no PDF) */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/" className="text-sm font-medium text-indigo-600 hover:underline">
          ← Nova análise
        </Link>
        <div className="flex items-center gap-3">
          {payload.usedFallback && (
            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">
              Gerado pelo provider reserva
            </span>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-600 px-3 py-1.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
          >
            ⬇ Exportar para PDF
          </button>
        </div>
      </div>

      {/* Título da página (aparece também no PDF exportado) */}
      <h1 className="mb-6 text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        Resultado da Análise de Perfil
      </h1>

      {/* HERO: nota geral + radar */}
      <section className="reveal mb-8 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="grid items-center gap-4 p-6 sm:grid-cols-2 sm:p-8">
          {/* Nota geral */}
          <div className="flex flex-col items-center text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Nota geral do perfil
            </p>
            <ScoreGauge score={result.overallScore} color={tier.color} />
            <span
              className="mt-4 rounded-full px-4 py-1 text-sm font-bold text-white"
              style={{ backgroundColor: tier.color }}
            >
              {tier.label}
            </span>
            <p className="mt-3 max-w-xs text-sm text-gray-500">
              {VERDICTS[tier.index]}
            </p>
          </div>

          {/* Radar */}
          <div>
            <p className="mb-1 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
              Visão geral por seção
            </p>
            <ScoreRadarChart sections={result.sections} color={tier.color} />
          </div>
        </div>

        {/* Faixa de qualidade */}
        <div className="border-t border-gray-100 bg-gray-50/70 px-6 py-4 sm:px-8">
          <TierBar current={tier.index} />
        </div>
      </section>

      {/* Checklist */}
      <section className="reveal mb-8" style={{ animationDelay: "80ms" }}>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Checklist rápido</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(result.checklist).map(([key, ok]) => (
            <span
              key={key}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                ok
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : "bg-gray-100 text-gray-400 ring-1 ring-gray-200"
              }`}
            >
              <span className={ok ? "text-emerald-500" : "text-gray-300"}>
                {ok ? "✓" : "✕"}
              </span>
              {CHECKLIST_LABELS[key] || key}
            </span>
          ))}
        </div>
      </section>

      {/* Cards por seção */}
      <PaywallGate feature="fullReport">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Análise detalhada por seção
        </h2>
        <section className="space-y-5">
          {SECTION_TITLES.map(({ key, title }, i) => (
            <div
              key={key}
              className="reveal"
              style={{ animationDelay: `${120 + i * 60}ms` }}
            >
              <SectionCard index={i + 1} title={title} data={result.sections[key]} />
            </div>
          ))}
        </section>
      </PaywallGate>

      {/* Boas práticas que não dá pra medir a partir do PDF */}
      <section className="reveal mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Boas práticas que o PDF não mede
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          A análise acima cobre o texto do seu perfil. Estes sinais também pesam
          no algoritmo do LinkedIn, mas não aparecem no PDF exportado — vale
          conferir manualmente.
        </p>

        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              Indexação (ser encontrado)
            </h3>
            <ul className="space-y-1.5 text-sm text-gray-700">
              <li>📸 Foto de perfil profissional</li>
              <li>🖼️ Banner contextualizado com sua área</li>
              <li>📍 Localização precisa (cidade e país)</li>
              <li>🤝 500+ conexões relevantes do seu setor</li>
              <li>🟢 &quot;Open to Work&quot; ativo (pode ser só para recrutadores)</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              Autoridade no feed
            </h3>
            <ul className="space-y-1.5 text-sm text-gray-700">
              <li>💬 Comente com opinião técnica em posts de líderes da área</li>
              <li>🎠 Publique em formatos que retêm atenção (carrossel, vídeo)</li>
              <li>✨ Priorize autenticidade — conteúdo genérico é penalizado e
                interações reais elevam seu SSI</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Doação via PIX */}
      <PixDonation />

      <p className="mt-10 text-center text-xs text-gray-400">
        Gerado por IA · Analisador de Perfil do LinkedIn
      </p>
    </main>
  );
}

// -- Auxiliares visuais --

/** Barra segmentada das 4 faixas, destacando a atual. */
function TierBar({ current }: { current: number }) {
  return (
    <div className="flex gap-1.5">
      {TIERS.map((t, i) => (
        <div key={t.label} className="flex-1 text-center">
          <div
            className="h-1.5 rounded-full transition"
            style={{ backgroundColor: i <= current ? t.color : "#e5e7eb" }}
          />
          <span
            className={`mt-1.5 block text-[11px] font-medium ${
              i === current ? "text-gray-800" : "text-gray-400"
            }`}
          >
            {t.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      {children}
    </main>
  );
}
