import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGestor, roleLabel } from "@/lib/permissions";
import { registrarAuditoria } from "@/lib/audit";
import { sendCobrancaEmail } from "@/lib/smtpEmail";
import { validarEmailsCopia } from "@/lib/emailList";

// Vercel corta o corpo da request em ~4,5 MB; NF-e e boleto em PDF ficam bem
// abaixo disso, mas o limite aqui evita erro genérico de gateway.
const LIMITE_POR_ARQUIVO = 3 * 1024 * 1024;
const LIMITE_TOTAL = 4 * 1024 * 1024;
const TIPOS_ACEITOS = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

const ANEXOS = [
  { campo: "nfe", rotulo: "NF-e de serviço", prefixo: "NFe" },
  { campo: "boleto", rotulo: "Boleto", prefixo: "Boleto" },
];

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !isGestor(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const os = await prisma.ordemServico.findUnique({
    where: { id: params.id },
    include: { cliente: true },
  });
  if (!os || os.deletedAt) {
    return NextResponse.json({ error: "Ordem de serviço não encontrada" }, { status: 404 });
  }
  if (os.status !== "concluida") {
    return NextResponse.json({ error: "Só é possível enviar a cobrança de uma OS concluída" }, { status: 400 });
  }
  if (!os.cliente?.email) {
    return NextResponse.json({ error: "Cliente não tem e-mail cadastrado" }, { status: 400 });
  }

  let form;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Envio inválido" }, { status: 400 });
  }

  const numeroOs = os.id.slice(-6).toUpperCase();
  const anexos = [];
  let total = 0;
  for (const { campo, rotulo, prefixo } of ANEXOS) {
    const arquivo = form.get(campo);
    if (!arquivo || typeof arquivo === "string" || arquivo.size === 0) continue;
    const extensao = TIPOS_ACEITOS[arquivo.type];
    if (!extensao) {
      return NextResponse.json({ error: `${rotulo}: envie um PDF ou imagem (JPG/PNG)` }, { status: 400 });
    }
    if (arquivo.size > LIMITE_POR_ARQUIVO) {
      return NextResponse.json({ error: `${rotulo}: arquivo acima de 3 MB` }, { status: 413 });
    }
    total += arquivo.size;
    anexos.push({
      filename: `${prefixo}-OS-${numeroOs}${extensao}`,
      content: Buffer.from(await arquivo.arrayBuffer()),
      contentType: arquivo.type,
    });
  }
  if (anexos.length === 0) {
    return NextResponse.json({ error: "Anexe a NF-e e/ou o boleto" }, { status: 400 });
  }
  if (total > LIMITE_TOTAL) {
    return NextResponse.json({ error: "Anexos somam mais de 4 MB" }, { status: 413 });
  }

  const { emails: cc, error: erroCc } = validarEmailsCopia(form.get("cc"));
  if (erroCc) {
    return NextResponse.json({ error: erroCc }, { status: 400 });
  }
  const mensagem = typeof form.get("mensagem") === "string" ? form.get("mensagem").trim() : "";

  try {
    await sendCobrancaEmail(os.cliente.email, {
      clienteNome: os.cliente.name,
      numeroOs,
      servico: os.serviceType,
      concluidaEm: os.concluidaEm,
      valor: os.value,
      vencimento: os.dueDate,
      mensagem,
      anexos,
      cc,
    });
  } catch (err) {
    console.error("Falha ao enviar NF-e/boleto da OS:", err);
    return NextResponse.json(
      { error: "Não foi possível enviar o e-mail. Verifique a configuração da caixa financeiro@." },
      { status: 502 }
    );
  }

  const atualizada = await prisma.ordemServico.update({
    where: { id: os.id },
    data: { cobrancaEnviadaEm: new Date() },
    select: { cobrancaEnviadaEm: true },
  });

  await registrarAuditoria({
    session,
    action: "update",
    entity: "OrdemServico",
    entityId: os.id,
    description: `${session.user.name} (${roleLabel(session.user.role)}) enviou ${anexos
      .map((a) => a.filename)
      .join(" e ")} da OS de ${os.cliente.name} por e-mail (${os.cliente.email})${cc ? ` com cópia para ${cc}` : ""}`,
  });

  return NextResponse.json({ ok: true, cobrancaEnviadaEm: atualizada.cobrancaEnviadaEm });
}
