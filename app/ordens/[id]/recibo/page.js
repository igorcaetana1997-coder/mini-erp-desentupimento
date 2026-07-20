import { getServerSession } from "next-auth/next";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStatusPagamento } from "@/lib/paymentStatus";
import { isGestor } from "@/lib/permissions";
import ReciboDocumento from "./ReciboDocumento";

export default async function ReciboPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const os = await prisma.ordemServico.findUnique({
    where: { id: params.id },
    include: { cliente: true, technician: { select: { id: true, name: true } } },
  });

  if (!os) notFound();

  const isGestorUser = isGestor(session.user.role);
  const isOwner =
    os.technicianId === session.user.id ||
    (session.user.role === "parceiro" && os.parceiroId === session.user.parceiroId);
  if (!isGestorUser && !isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center text-[rgb(var(--ink-strong)/1)]">
        Você não tem acesso ao recibo desta ordem de serviço.
      </div>
    );
  }

  const dataVisitaLabel = new Date(os.scheduledAt).toLocaleString("pt-BR", { timeZone: "UTC" });
  const emitidoEmLabel = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  return (
    <div className="min-h-screen bg-[rgb(var(--page-bg))]">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <ReciboDocumento
          osId={os.id}
          serviceType={os.serviceType}
          cliente={os.cliente}
          dataVisitaLabel={dataVisitaLabel}
          tecnicoNome={os.technician?.name || null}
          value={os.value}
          valorPago={os.valorPago}
          paymentMethod={os.paymentMethod}
          statusPagamento={getStatusPagamento(os)}
          status={os.status}
          materiais={os.materiais}
          avaliacaoNota={os.avaliacaoNota}
          assinaturaCliente={os.assinaturaCliente}
          emitidoEmLabel={emitidoEmLabel}
        />
      </div>
    </div>
  );
}
