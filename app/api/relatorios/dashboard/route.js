import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcularFaixa } from "@/lib/comissaoTecnico";
import { getStatusPagamento } from "@/lib/paymentStatus";
import { isGestor } from "@/lib/permissions";

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
  if (!session || !isGestor(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("month") || mesAtual();
  const { from, to } = limitesDoMes(mes);
  const diasAlerta = Number(searchParams.get("diasAlerta")) || 15;

  const [abertas, andamento, ordensDoMes, faixas, osConcluidasComValor, clientesComNascimento] = await Promise.all([
    prisma.ordemServico.count({ where: { status: "aberta", deletedAt: null } }),
    prisma.ordemServico.count({ where: { status: "andamento", deletedAt: null } }),
    prisma.ordemServico.findMany({
      where: { scheduledAt: { gte: from, lte: to }, status: { in: ["concluida", "recusada"] }, deletedAt: null },
      include: {
        technician: { select: { id: true, name: true } },
        parceiro: { select: { id: true, name: true } },
      },
    }),
    prisma.faixaComissao.findMany({ orderBy: { minValor: "asc" } }),
    prisma.ordemServico.findMany({
      where: { status: "concluida", deletedAt: null, value: { not: null } },
      include: { cliente: { select: { id: true, name: true } } },
    }),
    prisma.cliente.findMany({ where: { dataNascimento: { not: null }, deletedAt: null } }),
  ]);

  const concluidasArr = ordensDoMes.filter((os) => os.status === "concluida");
  const recusadasArr = ordensDoMes.filter((os) => os.status === "recusada");
  const concluidas = concluidasArr.length;
  const recusadas = recusadasArr.length;

  const faturamentoPago = concluidasArr.reduce((sum, os) => sum + (os.valorPago || 0), 0);
  const faturamentoPendente = concluidasArr.reduce((sum, os) => sum + getStatusPagamento(os).faltante, 0);
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

  // Alerta de pagamento pendente antigo: OS concluída há mais de `diasAlerta` dias
  // que ainda não foi totalmente paga. Não é filtrado pelo mês selecionado — reflete
  // o estado atual, igual ao pipeline.
  const agora = Date.now();
  const alertaPagamentosCompleto = osConcluidasComValor
    .map((os) => {
      const { status, faltante } = getStatusPagamento(os);
      if (status !== "pendente" && status !== "parcial") return null;
      const referencia = os.concluidaEm || os.updatedAt;
      const diasAtraso = Math.floor((agora - new Date(referencia).getTime()) / (1000 * 60 * 60 * 24));
      if (diasAtraso < diasAlerta) return null;
      return {
        id: os.id,
        cliente: os.cliente?.name || "—",
        serviceType: os.serviceType,
        faltante,
        diasAtraso,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.diasAtraso - a.diasAtraso);

  const alertaPagamentos = {
    diasAlerta,
    total: alertaPagamentosCompleto.length,
    itens: alertaPagamentosCompleto.slice(0, 10),
  };

  // Próximos aniversários (30 dias), também sem filtro de mês.
  const hoje = new Date();
  const hojeUTC = Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate());
  const proximosAniversarios = clientesComNascimento
    .map((c) => {
      const nasc = new Date(c.dataNascimento);
      const mesNasc = nasc.getUTCMonth();
      const diaNasc = nasc.getUTCDate();
      let proximoTs = Date.UTC(hoje.getUTCFullYear(), mesNasc, diaNasc);
      if (proximoTs < hojeUTC) proximoTs = Date.UTC(hoje.getUTCFullYear() + 1, mesNasc, diaNasc);
      const diasAte = Math.round((proximoTs - hojeUTC) / (1000 * 60 * 60 * 24));
      return {
        id: c.id,
        nome: c.name,
        data: `${String(diaNasc).padStart(2, "0")}/${String(mesNasc + 1).padStart(2, "0")}`,
        diasAte,
      };
    })
    .filter((c) => c.diasAte <= 30)
    .sort((a, b) => a.diasAte - b.diasAte);

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
    alertaPagamentos,
    proximosAniversarios,
  });
}
