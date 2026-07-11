import { getServerSession } from "next-auth/next";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stamp from "@/components/Stamp";
import ReciboActions from "./ReciboActions";
import { formatEndereco } from "@/lib/formatEndereco";
import { getStatusPagamento } from "@/lib/paymentStatus";

const PAYMENT_LABELS = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao: "Cartão",
  boleto: "Boleto",
};

export default async function ReciboPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const os = await prisma.ordemServico.findUnique({
    where: { id: params.id },
    include: { cliente: true, technician: { select: { id: true, name: true } } },
  });

  if (!os) notFound();

  const isAdmin = session.user.role === "admin";
  const isOwner =
    os.technicianId === session.user.id ||
    (session.user.role === "parceiro" && os.parceiroId === session.user.parceiroId);
  if (!isAdmin && !isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center text-[rgb(var(--ink-strong)/1)]">
        Você não tem acesso ao recibo desta ordem de serviço.
      </div>
    );
  }

  const dataVisita = new Date(os.scheduledAt).toLocaleString("pt-BR", { timeZone: "UTC" });

  return (
    <div className="min-h-screen bg-[rgb(var(--page-bg))] print:bg-[rgb(var(--input-bg))]">
      <div className="max-w-xl mx-auto p-4 md:p-8 print:p-0">
        <ReciboActions telefone={os.cliente?.phone} osId={os.id} />

        <div className="bg-[rgb(var(--surface))] border-2 border-[rgb(var(--border-strong)/1)] p-6 print:border-0 print:shadow-none">
          <div className="flex items-center justify-between border-b-2 border-dashed border-[rgb(var(--border-strong)/0.3)] pb-3 mb-4">
            <div>
              <Image
                src="/logo-horizontal-outline.png"
                alt="Real Leader Desentupidora"
                width={1800}
                height={603}
                className="h-10 w-auto mb-1"
              />
              <p className="text-xs text-[rgb(var(--stone))]">Recibo de ordem de serviço</p>
            </div>
            <Stamp status={os.status} />
          </div>

          <p className="font-mono text-xs text-[rgb(var(--stone))] mb-1">OS #{os.id.slice(-6).toUpperCase()}</p>
          <p className="font-black uppercase text-[rgb(var(--ink-strong)/1)] text-xl mb-4">{os.serviceType}</p>

          <div className="grid sm:grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase text-[rgb(var(--stone))]">Cliente</p>
              <p className="text-[rgb(var(--ink-strong)/1)] font-semibold">{os.cliente?.name}</p>
              <p className="text-[rgb(var(--ink))]">{formatEndereco(os.cliente)}</p>
              <p className="text-[rgb(var(--ink))]">{os.cliente?.phone}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-[rgb(var(--stone))]">Atendimento</p>
              <p className="text-[rgb(var(--ink-strong)/1)]">{dataVisita}</p>
              <p className="text-[rgb(var(--ink))]">Técnico: {os.technician?.name || "—"}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase text-[rgb(var(--stone))]">Valor</p>
              <p className="font-mono font-bold text-[rgb(var(--ink-strong)/1)] text-lg">
                {os.value ? `R$ ${Number(os.value).toFixed(2)}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-[rgb(var(--stone))]">Pagamento</p>
              <p className="text-[rgb(var(--ink-strong)/1)]">
                {PAYMENT_LABELS[os.paymentMethod] || "Não informado"} —{" "}
                <span
                  className={
                    getStatusPagamento(os).status === "pago"
                      ? "text-[#1E7A52]"
                      : getStatusPagamento(os).status === "parcial"
                      ? "text-[#E8A33D]"
                      : "text-[#A02018]"
                  }
                >
                  {getStatusPagamento(os).status === "pago"
                    ? "Pago"
                    : getStatusPagamento(os).status === "parcial"
                    ? `Parcial (falta R$ ${getStatusPagamento(os).faltante.toFixed(2)})`
                    : "Pendente"}
                </span>
              </p>
            </div>
          </div>

          {os.materiais && (
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase text-[rgb(var(--stone))]">Materiais/peças usados</p>
              <p className="text-sm text-[rgb(var(--ink-strong)/1)]">{os.materiais}</p>
            </div>
          )}

          {os.avaliacaoNota && (
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase text-[rgb(var(--stone))]">Avaliação</p>
              <p className="text-sm text-[rgb(var(--ink-strong)/1)]">{os.avaliacaoNota} / 5</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t-2 border-dashed border-[rgb(var(--border-strong)/0.3)]">
            <p className="text-[10px] font-bold uppercase text-[rgb(var(--stone))] mb-1">Assinatura do cliente</p>
            {os.assinaturaCliente ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={os.assinaturaCliente} alt="Assinatura do cliente" className="h-24 border border-[rgb(var(--border-strong)/0.2)] bg-[rgb(var(--input-bg))]" />
            ) : (
              <p className="text-xs text-[rgb(var(--stone))]">Sem assinatura registrada.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
