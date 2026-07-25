import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildCsvString } from "@/lib/exportCsv";
import { formatEndereco } from "@/lib/formatEndereco";
import { sendClientesBackupEmail } from "@/lib/email";

const HEADERS = [
  "Nome",
  "Telefone",
  "E-mail",
  "Documento",
  "Data de nascimento",
  "Endereço",
  "CEP",
  "Observações",
  "Cadastrado em",
];

function formatData(value) {
  return value ? new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "";
}

// Disparada toda sexta-feira pelo Vercel Cron (ver vercel.json) — manda um
// CSV com todos os clientes ativos por e-mail pro admin, como backup.
export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const clientes = await prisma.cliente.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });

  const linhas = clientes.map((c) => [
    c.name,
    c.phone,
    c.email,
    c.documento,
    formatData(c.dataNascimento),
    formatEndereco(c),
    c.cep,
    c.observacoes,
    formatData(c.createdAt),
  ]);

  const csv = buildCsvString(HEADERS, linhas);

  try {
    await sendClientesBackupEmail(csv, clientes.length);
  } catch (err) {
    console.error("[cron] Falha ao enviar backup de clientes:", err);
    return NextResponse.json({ enviado: false, erro: String(err) }, { status: 500 });
  }

  return NextResponse.json({ enviado: true, quantidade: clientes.length });
}
