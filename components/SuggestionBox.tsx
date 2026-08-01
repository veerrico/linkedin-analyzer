"use client";

// Caixa "sugestão de texto" com abas PT/EN e botão copiar.

import { useState } from "react";

interface SuggestionBoxProps {
  suggestionPT: string;
  suggestionEN: string;
}

export default function SuggestionBox({
  suggestionPT,
  suggestionEN,
}: SuggestionBoxProps) {
  const [lang, setLang] = useState<"pt" | "en">("pt");
  const [copied, setCopied] = useState(false);

  const text = lang === "pt" ? suggestionPT : suggestionEN;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard pode falhar em contexto não seguro; ignoramos.
    }
  }

  if (!suggestionPT && !suggestionEN) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white">
      <div className="flex items-center justify-between border-b border-indigo-100 px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-700">
          <SparkIcon />
          Sugestão pronta para copiar
        </span>
        <div className="flex items-center gap-2 print:hidden">
          <div className="flex rounded-lg bg-white p-0.5 text-xs shadow-sm ring-1 ring-indigo-100">
            {(["pt", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`rounded-md px-2 py-0.5 font-semibold uppercase transition ${
                  lang === l ? "bg-indigo-600 text-white" : "text-gray-500"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-indigo-700"
          >
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
      </div>
      <p className="whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed text-gray-800">
        {text || "(sem sugestão)"}
      </p>
    </div>
  );
}

function SparkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l2.2 5.8L20 10l-5.8 2.2L12 18l-2.2-5.8L4 10l5.8-2.2L12 2z" />
    </svg>
  );
}
