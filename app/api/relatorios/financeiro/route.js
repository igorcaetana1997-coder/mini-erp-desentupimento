import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcularFaixa } from "@/lib/comissaoTecnico";
import { getStatusPagamento } from "@/lib/paymentStatus";
import { isGestor } from "@/lib/permissions";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || !isGestor(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const technicianId = searchParams.get("technicianId");

  const whereOrdens = { status: "concluida", deletedAt: null };
  if (from || to) {
    whereOrdens.scheduledAt = {};
    if (from) whereOrdens.scheduledAt.gte = new Date(`${from}T00:00:00`);
    if (to) whereOrdens.scheduledAt.lte = new Date(`${to}T23:59:59`);
  }
  if (technicianId) whereOrdens.technicianId = technicianId;

  const whereDespesas = {};
  if (from || to) {
    whereDespesas.data = {};
    if (from) whereDespesas.data.gte = new Date(`${from}T00:00:00`);
    if (to) whereDespesas.data.lte = new Date(`${to}T23:59:59`);
  }

  const [ordens, despesas, faixas] = await Promise.all([
    prisma.ordemServico.findMany({
      where: whereOrdens,
      include: {
        cliente: { select: { id: true, name: true } },
        technician: { select: { id: true, name: true } },
        parceiro: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: "desc" },
    }),
    prisma.despesa.findMany({ where: whereDespesas, orderBy: { data: "desc" } }),
    prisma.faixaComissao.findMany({ orderBy: { minValor: "asc" } }),
  ]);

  const totalFaturado = ordens.reduce((sum, os) => sum + (os.value || 0), 0);
  // Comissões (parceiro/técnico) só valem sobre OS totalmente pagas — pagamento
  // parcial ainda não "fecha" a conta pra fins de comissão.
  const ordensPagas = ordens.filter((os) => getStatusPagamento(os).status === "pago");
  const totalPago = ordens.reduce((sum, os) => sum + (os.valorPago || 0), 0);
  const totalPendente = totalFaturado - totalPago;
  const totalDespesas = despesas.reduce((sum, d) => sum + (d.valor || 0), 0);

  const porTecnico = {};
  for (const os of ordens) {
    const nome = os.technician?.name || "Sem técnico";
    porTecnico[nome] = (porTecnico[nome] || 0) + (os.value || 0);
  }

  const porParceiro = {};
  for (const os of ordens) {
    if (!os.parceiro) continue;
    porParceiro[os.parceiro.name] = (porParceiro[os.parceiro.name] || 0) + (os.value || 0);
  }

  const porCategoria = {};
  for (const d of despesas) {
    const cat = d.categoria || "Outro";
    porCategoria[cat] = (porCategoria[cat] || 0) + (d.valor || 0);
  }

  // Comissões — calculadas só sobre OS concluídas E pagas, pra refletir caixa real.
  let comissaoPagaParceiros = 0;
  let comissaoRecebidaParceiros = 0;
  for (const os of ordensPagas) {
    if (!os.parceiro || !os.parceriaTipo || !os.parceriaPercentual) continue;
    const valorComissao = (os.value || 0) * (os.parceriaPercentual / 100);
    if (os.parceriaTipo === "recebido") comissaoPagaParceiros += valorComissao;
    else if (os.parceriaTipo === "repassado") comissaoRecebidaParceiros += valorComissao;
  }

  const totalPorTecnicoPago = {};
  for (const os of ordensPagas) {
    if (!os.technicianId) continue;
    totalPorTecnicoPago[os.technicianId] = (totalPorTecnicoPago[os.technicianId] || 0) + (os.value || 0);
  }
  let comissaoPagaTecnicos = 0;
  for (const totalTecnico of Object.values(totalPorTecnicoPago)) {
    const faixa = calcularFaixa(faixas, totalTecnico);
    if (faixa) comissaoPagaTecnicos += totalTecnico * (faixa.percentual / 100);
  }

  const saldo =
    totalPago - totalDespesas - comissaoPagaParceiros + comissaoRecebidaParceiros - comissaoPagaTecnicos;

  return NextResponse.json({
    ordens,
    despesas,
    totais: {
      totalFaturado,
      totalPago,
      totalPendente,
      totalDespesas,
      saldo,
      quantidade: ordens.length,
    },
    comissoes: {
      pagaParceiros: comissaoPagaParceiros,
      recebidaParceiros: comissaoRecebidaParceiros,
      pagaTecnicos: comissaoPagaTecnicos,
    },
    porTecnico,
    porParceiro,
    porCategoria,
  });
}
