import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcularFaixa } from "@/lib/comissaoTecnico";

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function limitesDoMes(mes) {
  const [ano, mesNum] = mes.split("-").map(Number);
  const from = new Date(ano, mesNum - 1, 1, 0, 0, 0);
  const to = new Date(ano, mesNum, 0, 23, 59, 59);
  return { from, to };
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("month") || mesAtual();
  const { from, to } = limitesDoMes(mes);

  const [abertas, andamento, ordensDoMes, faixas] = await Promise.all([
    prisma.ordemServico.count({ where: { status: "aberta" } }),
    prisma.ordemServico.count({ where: { status: "andamento" } }),
    prisma.ordemServico.findMany({
      where: { scheduledAt: { gte: from, lte: to }, status: { in: ["concluida", "recusada"] } },
      include: {
        technician: { select: { id: true, name: true } },
        parceiro: { select: { id: true, name: true } },
      },
    }),
    prisma.faixaComissao.findMany({ orderBy: { minValor: "asc" } }),
  ]);

  const concluidasArr = ordensDoMes.filter((os) => os.status === "concluida");
  const recusadasArr = ordensDoMes.filter((os) => os.status === "recusada");
  const concluidas = concluidasArr.length;
  const recusadas = recusadasArr.length;

  const faturamentoPago = concluidasArr
    .filter((os) => os.paymentStatus === "pago")
    .reduce((sum, os) => sum + (os.value || 0), 0);
  const faturamentoPendente = concluidasArr
    .filter((os) => os.paymentStatus !== "pago")
    .reduce((sum, os) => sum + (os.value || 0), 0);
  const faturamentoTotal = faturamentoPago + faturamentoPendente;
  const ticketMedio = concluidas > 0 ? faturamentoTotal / concluidas : 0;
  const taxaConclusao = concluidas + recusadas > 0 ? concluidas / (concluidas + recusadas) : null;

  // Ranking por produção (todas as OS concluídas no mês, pagas ou não) — métrica
  // operacional, diferente do "comissoes" do Financeiro que só olha OS pagas.
  const producaoPorTecnico = {};
  for (const os of concluidasArr) {
    if (!os.technicianId) continue;
    if (!producaoPorTecnico[os.technicianId]) {
      producaoPorTecnico[os.technicianId] = { nome: os.technician?.name || "—", total: 0 };
    }
    producaoPorTecnico[os.technicianId].total += os.value || 0;
  }
  const rankingTecnicos = Object.values(producaoPorTecnico)
    .map((t) => {
      const faixa = calcularFaixa(faixas, t.total);
      const comissao = faixa ? t.total * (faixa.percentual / 100) : 0;
      return { nome: t.nome, total: t.total, percentual: faixa?.percentual ?? null, comissao };
    })
    .sort((a, b) => b.total - a.total);

  const producaoPorParceiro = {};
  for (const os of concluidasArr) {
    if (!os.parceiroId) continue;
    if (!producaoPorParceiro[os.parceiroId]) {
      producaoPorParceiro[os.parceiroId] = { nome: os.parceiro?.name || "—", total: 0, tipo: os.parceriaTipo };
    }
    producaoPorParceiro[os.parceiroId].total += os.value || 0;
    const percentual = os.parceriaPercentual || 0;
    const comissao = (os.value || 0) * (percentual / 100);
    producaoPorParceiro[os.parceiroId].comissao = (producaoPorParceiro[os.parceiroId].comissao || 0) + comissao;
  }
  const rankingParceiros = Object.values(producaoPorParceiro).sort((a, b) => b.total - a.total);

  return NextResponse.json({
    mes,
    pipeline: { abertas, andamento },
    periodo: {
      concluidas,
      recusadas,
      faturamentoPago,
      faturamentoPendente,
      ticketMedio,
      taxaConclusao,
    },
    rankingTecnicos,
    rankingParceiros,
  });
}
