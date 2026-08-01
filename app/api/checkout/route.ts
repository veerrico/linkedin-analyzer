// POST /api/checkout
// Stub de pagamento. Enquanto ENABLE_PAYMENTS=false, retorna 501.
// A integração com um gateway (a decidir: Stripe, Mercado Pago, etc.) entra aqui.

import { NextResponse } from "next/server";
import { isEnabled } from "@/lib/featureFlags";

export const runtime = "nodejs";

export async function POST() {
  const paymentsOn = await isEnabled("payments");
  if (!paymentsOn) {
    return NextResponse.json(
      { error: "Pagamentos desativados (ENABLE_PAYMENTS=false)." },
      { status: 501 }
    );
  }

  // TODO: integração com gateway de pagamento.
  //  1. criar sessão de checkout no gateway (valor, moeda, metadata analysisId);
  //  2. gravar linha em `payments` com status 'pending';
  //  3. retornar a URL de checkout para o frontend redirecionar;
  //  4. tratar o webhook de confirmação em /api/webhooks/payment (a criar).
  return NextResponse.json(
    { error: "Checkout ainda não implementado." },
    { status: 501 }
  );
}
