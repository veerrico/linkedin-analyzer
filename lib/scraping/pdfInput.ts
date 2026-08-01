// Extração de texto do PDF exportado oficialmente pelo LinkedIn
// ("Mais" -> "Salvar como PDF"). Modo prático e 100% dentro dos Termos:
// o próprio usuário gera e envia o arquivo.
//
// Usamos `unpdf` porque funciona em ambiente serverless (Vercel) sem depender
// de binários nativos.

import { extractText, getDocumentProxy } from "unpdf";

/** Tamanho máximo aceito (evita abuso e travar a função serverless). */
export const MAX_PDF_BYTES = 8 * 1024 * 1024; // 8 MB

/** Extrai o texto corrido de um PDF. Lança erro se o arquivo for inválido. */
export async function extractPdfText(data: ArrayBuffer): Promise<string> {
  if (data.byteLength === 0) {
    throw new Error("Arquivo PDF vazio.");
  }
  if (data.byteLength > MAX_PDF_BYTES) {
    throw new Error("PDF muito grande (máximo 8 MB).");
  }

  const pdf = await getDocumentProxy(new Uint8Array(data));
  const { text } = await extractText(pdf, { mergePages: true });

  const clean = (text || "").trim();
  if (clean.length < 30) {
    throw new Error(
      "Não consegui ler texto do PDF. Ele pode ser uma imagem escaneada — " +
        "use o PDF gerado pelo próprio LinkedIn (Mais → Salvar como PDF)."
    );
  }
  return clean;
}
