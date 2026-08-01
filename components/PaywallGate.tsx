// PaywallGate: envolve conteúdo "premium". Enquanto os pagamentos estiverem
// desligados (padrão do MVP), TUDO fica liberado — apenas renderiza os filhos.
//
// Quando ENABLE_PAYMENTS for ligado, é aqui que entra a lógica de bloqueio
// (borrar o conteúdo, mostrar CTA de compra, chamar /api/checkout, etc.).

import type { ReactNode } from "react";

interface PaywallGateProps {
  /** Nome da feature paga (ex: "fullReport"). */
  feature: string;
  children: ReactNode;
}

/**
 * Lê a flag pública de pagamentos. Precisa ser NEXT_PUBLIC_* para o cliente
 * enxergar. Por padrão vem desligada -> conteúdo liberado.
 */
function paymentsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_PAYMENTS === "true";
}

export default function PaywallGate({ feature, children }: PaywallGateProps) {
  // MVP: pagamentos desligados -> libera tudo.
  if (!paymentsEnabled()) {
    return <>{children}</>;
  }

  // TODO (quando ativar pagamentos): checar se o usuário pagou por `feature`.
  // Se não pagou, renderizar uma prévia borrada + botão "Desbloquear".
  // Por enquanto, mesmo com a flag ligada, mostramos o conteúdo.
  return (
    <div data-feature={feature}>
      {children}
    </div>
  );
}
