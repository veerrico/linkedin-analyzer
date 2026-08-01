// Geração do payload "PIX Copia e Cola" (BR Code / padrão EMV do Banco Central).
// Tudo local, sem serviço externo. A chave é ALEATÓRIA (só permite RECEBER),
// então é seguro deixá-la aqui.

// ⚙️ Configuração da doação — ajuste nome/cidade se quiser.
export const PIX_KEY = "01c01e3e-9fca-4938-b318-7b2cf37d9761";
export const PIX_NAME = "VICTOR DERRICO"; // máx. 25 caracteres, sem acento
export const PIX_CITY = "RIBEIRAO PRETO"; // máx. 15 caracteres, sem acento

/** Monta um campo EMV no formato ID + tamanho(2 dígitos) + valor. */
function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

/** CRC16-CCITT (polinômio 0x1021, inicial 0xFFFF) exigido pelo padrão PIX. */
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Gera o código "Copia e Cola" de uma doação PIX estática (sem valor fixo —
 * quem doa escolhe quanto). Serve tanto para o texto quanto para o QR Code.
 */
export function buildPixPayload({
  key = PIX_KEY,
  name = PIX_NAME,
  city = PIX_CITY,
}: { key?: string; name?: string; city?: string } = {}): string {
  const merchantAccount = tlv(
    "26",
    tlv("00", "br.gov.bcb.pix") + tlv("01", key)
  );
  const additionalData = tlv("62", tlv("05", "***"));

  const payload =
    tlv("00", "01") + // Payload Format Indicator
    merchantAccount + // Merchant Account Information (PIX)
    tlv("52", "0000") + // Merchant Category Code
    tlv("53", "986") + // Moeda: BRL
    tlv("58", "BR") + // País
    tlv("59", name.slice(0, 25)) + // Nome do recebedor
    tlv("60", city.slice(0, 15)) + // Cidade
    additionalData +
    "6304"; // ID + tamanho do CRC (o valor vem a seguir)

  return payload + crc16(payload);
}
