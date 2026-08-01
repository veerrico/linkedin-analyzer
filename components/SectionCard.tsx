// Card de uma seção do relatório: número, nota (anel colorido), pontos fortes,
// pontos a melhorar e a sugestão de reescrita.

import type { SectionScore } from "@/lib/types";
import SuggestionBox from "./SuggestionBox";

interface SectionCardProps {
  index: number;
  title: string;
  data: SectionScore;
}

/** Cor da nota conforme a faixa (0-10). */
function toneFor(score: number): { text: string; ring: string; bg: string } {
  if (score >= 8)
    return { text: "text-emerald-700", ring: "ring-emerald-500", bg: "bg-emerald-50" };
  if (score >= 5)
    return { text: "text-amber-700", ring: "ring-amber-500", bg: "bg-amber-50" };
  return { text: "text-red-700", ring: "ring-red-500", bg: "bg-red-50" };
}

function num(n: number) {
  return String(n).padStart(2, "0");
}

export default function SectionCard({ index, title, data }: SectionCardProps) {
  // Seção sem dados: mostramos como "Não avaliada", sem penalizar.
  if (!data.evaluated) {
    return (
      <div className="break-inside-avoid rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 p-5">
        <div className="mb-2 flex items-center gap-3">
          <span className="text-sm font-bold text-gray-300">{num(index)}</span>
          <h3 className="text-lg font-semibold text-gray-500">{title}</h3>
          <span className="ml-auto rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600">
            Não avaliada
          </span>
        </div>
        <p className="text-sm text-gray-500">
          Esta seção não foi fornecida, então não entrou na nota geral.
        </p>
        <SuggestionBox
          suggestionPT={data.suggestionPT}
          suggestionEN={data.suggestionEN}
        />
      </div>
    );
  }

  const tone = toneFor(data.score);

  return (
    <div className="break-inside-avoid rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md print:shadow-none">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-bold text-gray-300">{num(index)}</span>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span
          className={`ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full ${tone.bg} ${tone.text} text-sm font-extrabold ring-2 ${tone.ring}`}
        >
          {data.score}
        </span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <Dot className="bg-emerald-500" /> Pontos fortes
          </h4>
          {data.strengths.length > 0 ? (
            <ul className="space-y-1.5">
              {data.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="mt-0.5 text-emerald-500">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm italic text-gray-400">Nenhum identificado.</p>
          )}
        </div>

        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
            <Dot className="bg-amber-500" /> A melhorar
          </h4>
          {data.issues.length > 0 ? (
            <ul className="space-y-1.5">
              {data.issues.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="mt-0.5 text-amber-500">→</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm italic text-gray-400">Nenhum identificado.</p>
          )}
        </div>
      </div>

      <SuggestionBox
        suggestionPT={data.suggestionPT}
        suggestionEN={data.suggestionEN}
      />
    </div>
  );
}

function Dot({ className }: { className: string }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${className}`} />;
}
