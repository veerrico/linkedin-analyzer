"use client";

// Bloco de doação via PIX: mensagem + QR Code + "Copia e Cola" + chave.
// O QR é gerado no próprio navegador (sem serviço externo).

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { PIX_KEY, buildPixPayload } from "@/lib/pix";

export default function PixDonation() {
  const payload = buildPixPayload();
  const [copied, setCopied] = useState<"code" | "key" | null>(null);

  async function copy(text: string, which: "code" | "key") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // clipboard pode falhar em contexto não seguro; ignoramos.
    }
  }

  return (
    <section className="reveal mt-8 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 text-center">
      <div className="mx-auto max-w-xl">
        <h2 className="text-lg font-semibold text-gray-900">
          Gostou? Ajude a manter o projeto no ar 💙
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Esse projeto é gratuito e existe para ajudar quem está em busca de uma
          oportunidade. Manter a ferramenta no ar tem um pequeno custo (como os
          tokens da API de IA). Se ela te ajudou e você estiver confortável, uma
          doação via PIX faz toda a diferença.
        </p>

        <div className="mt-5 flex flex-col items-center gap-4">
          {/* QR Code */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <QRCodeSVG value={payload} size={168} marginSize={1} />
          </div>
          <p className="text-xs text-gray-500">
            Escaneie com o app do seu banco ou use o Copia e Cola abaixo.
          </p>

          {/* Copia e Cola */}
          <div className="flex w-full max-w-md items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs text-gray-600">
              {payload}
            </code>
            <button
              onClick={() => copy(payload, "code")}
              className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700 print:hidden"
            >
              {copied === "code" ? "Copiado!" : "Copiar código"}
            </button>
          </div>

          {/* Chave avulsa */}
          <button
            onClick={() => copy(PIX_KEY, "key")}
            className="text-xs text-gray-500 underline decoration-dotted underline-offset-2 hover:text-emerald-700 print:hidden"
          >
            {copied === "key" ? "Chave copiada!" : "ou copie só a chave PIX"}
          </button>
        </div>
      </div>
    </section>
  );
}
