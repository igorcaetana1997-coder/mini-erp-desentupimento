import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyClienteStatusChange } from "@/lib/notifications";
import { registrarAuditoria } from "@/lib/audit";
import { roleLabel } from "@/lib/permissions";

const include = {
  cliente: true,
  technician: { select: { id: true, name: true } },
  parceiro: { select: { id: true, name: true } },
  fotos: true,
};

// Só o técnico dono pode recusar, e só enquanto a OS está "aberta"
// (ainda não iniciou o atendimento).
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const os = await prisma.ordemServico.findUnique({ where: { id: params.id }, include: { cliente: true } });
  if (!os) {
    return NextResponse.json({ error: "Ordem de serviço não encontrada" }, { status: 404 });
  }

  if (session.user.role !== "tecnico" || os.technicianId !== session.user.id) {
    return NextResponse.json({ error: "Apenas o técnico designado pode recusar esta OS" }, { status: 403 });
  }

  if (os.status !== "aberta") {
    return NextResponse.json({ error: "Só é possível recusar uma OS que ainda está aberta" }, { status: 400 });
  }

  const body = await req.json();
  const motivo = (body.motivo || "").trim();
  if (!motivo) {
    return NextResponse.json({ error: "Informe o motivo da recusa" }, { status: 400 });
  }

  const updated = await prisma.ordemServico.update({
    where: { id: params.id },
    data: { status: "recusada", motivoRecusa: motivo, recusadaEm: new Date() },
    include,
  });

  notifyClienteStatusChange("os_recusada", { cliente: os.cliente, os: updated });

  await registrarAuditoria({
    session,
    action: "status",
    entity: "OrdemServico",
    entityId: updated.id,
    description: `${session.user.name} (${roleLabel(session.user.role)}) recusou a OS de ${os.cliente?.name || "cliente"}`,
  });

  return NextResponse.json(updated);
}
