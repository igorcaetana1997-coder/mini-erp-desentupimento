import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyClienteStatusChange } from "@/lib/notifications";
import { isGestor } from "@/lib/permissions";
import { registrarAuditoria } from "@/lib/audit";

const include = {
  cliente: true,
  technician: { select: { id: true, name: true } },
  parceiro: { select: { id: true, name: true } },
  fotos: true,
};

// Única transição simples: aberta -> andamento. De andamento pra concluída
// exige assinatura e passa por /concluir.
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const os = await prisma.ordemServico.findUnique({ where: { id: params.id }, include: { cliente: true } });
  if (!os) {
    return NextResponse.json({ error: "Ordem de serviço não encontrada" }, { status: 404 });
  }

  const isGestorUser = isGestor(session.user.role);
  const isOwner = os.technicianId === session.user.id;
  if (!isGestorUser && !isOwner) {
    return NextResponse.json({ error: "Você não tem acesso a esta ordem de serviço" }, { status: 403 });
  }

  if (os.status !== "aberta") {
    return NextResponse.json(
      { error: "Só é possível avançar uma OS que está aberta. Para concluir, use a tela de conclusão." },
      { status: 400 }
    );
  }

  const updated = await prisma.ordemServico.update({
    where: { id: params.id },
    data: { status: "andamento" },
    include,
  });

  notifyClienteStatusChange("os_em_andamento", { cliente: os.cliente, os: updated });

  await registrarAuditoria({
    session,
    action: "status",
    entity: "OrdemServico",
    entityId: updated.id,
    description: `${session.user.name} iniciou o atendimento da OS de ${os.cliente?.name || "cliente"}`,
  });

  return NextResponse.json(updated);
}
