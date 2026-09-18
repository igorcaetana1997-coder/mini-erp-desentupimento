import { NextResponse } from "next/server";
import { createElement } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGestor, roleLabel } from "@/lib/permissions";
import { registrarAuditoria } from "@/lib/audit";
import { sendOrcamentoEmail } from "@/lib/smtpEmail";
import { gerarPdfBufferServer } from "@/lib/pdf/gerarPdfServer";
import { getPdfAssets } from "@/lib/pdf/assets.server";
import OrcamentoPdfDocument from "@/lib/pdf/OrcamentoPdfDocument";
import { STATUS_STAMP } from "@/lib/orcamentoStamp";

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !isGestor(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const orcamento = await prisma.orcamento.findUnique({
    where: { id: params.id },
    include: { cliente: true, itens: { orderBy: { ordem: "asc" } } },
  });
  if (!orcamento) {
    return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
  }
  if (!orcamento.cliente?.email) {
    return NextResponse.json({ error: "Cliente não tem e-mail cadastrado" }, { status: 400 });
  }

  const emitidoEmLabel = new Date(orcamento.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const numero = `Nº ${orcamento.id.slice(-6).toUpperCase()}`;

  let pdfBuffer;
  try {
    const elemento = createElement(OrcamentoPdfDocument, {
      orcamento,
      stamp: STATUS_STAMP[orcamento.status],
      emitidoEmLabel,
      numero,
      assets: getPdfAssets(),
    });
    pdfBuffer = await gerarPdfBufferServer(elemento);
  } catch (err) {
    console.error("Falha ao gerar PDF do orçamento:", err);
    return NextResponse.json({ error: "Não foi possível gerar o PDF do orçamento" }, { status: 500 });
  }

  try {
    await sendOrcamentoEmail(orcamento.cliente.email, {
      pdfBuffer,
      nomeArquivo: `orcamento-${orcamento.id.slice(-6).toUpperCase()}.pdf`,
      mensagem: orcamento.mensagemCapa || "",
      numero,
      clienteNome: orcamento.cliente.name,
    });
  } catch (err) {
    console.error("Falha ao enviar e-mail do orçamento:", err);
    return NextResponse.json(
      { error: "Não foi possível enviar o e-mail. Verifique a configuração SMTP." },
      { status: 502 }
    );
  }

  await registrarAuditoria({
    session,
    action: "update",
    entity: "Orcamento",
    entityId: orcamento.id,
    description: `${session.user.name} (${roleLabel(session.user.role)}) enviou o orçamento de ${orcamento.cliente.name} por e-mail (${orcamento.cliente.email})`,
  });

  return NextResponse.json({ ok: true });
}
