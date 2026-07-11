"use client";

import { useEffect, useState, useCallback } from "react";
import { Wallet, CheckCircle2, Clock, TrendingDown, Scale, Plus, Trash2, Handshake, Download, Printer } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { downloadCsv } from "@/lib/exportCsv";
import { getStatusPagamento } from "@/lib/paymentStatus";

const STATUS_LABELS = { pago: "Pago", parcial: "Parcial", pendente: "Pendente" };
const STATUS_CLASSES = { pago: "text-[#1E7A52]", parcial: "text-[#E8A33D]", pendente: "text-[#A02018]" };

const CATEGORIAS = ["Material", "Combustível", "Manutenção", "Salário", "Outro"];

function firstDayOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function todayInputValue() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function formatMoney(n) {
  return `R$ ${Number(n || 0).toFixed(2)}`;
}

export default function FinanceiroClient() {
  const [tecnicos, setTecnicos] = useState([]);
  const [from, setFrom] = useState(firstDayOfMonth);
  const [to, setTo] = useState(todayInputValue);
  const [technicianId, setTechnicianId] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showDespesaForm, setShowDespesaForm] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [valor, setValor] = useState("");
  const [dataDespesa, setDataDespesa] = useState(todayInputValue);
  const [savingDespesa, setSavingDespesa] = useState(false);

  useEffect(() => {
    fetch("/api/tecnicos")
      .then((r) => r.json())
      .then(setTecnicos)
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (technicianId) params.set("technicianId", technicianId);
      const res = await fetch(`/api/relatorios/financeiro?${params.toString()}`);
      if (!res.ok) throw new Error();
      setReport(await res.json());
    } catch {
      setError("Não foi possível carregar o relatório.");
    } finally {
      setLoading(false);
    }
  }, [from, to, technicianId]);

  useEffect(() => {
    load();
  }, [load]);

  const addDespesa = async () => {
    if (!descricao.trim() || !valor) return;
    setSavingDespesa(true);
    try {
      const res = await fetch("/api/despesas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descricao, categoria, valor, data: dataDespesa }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao lançar despesa");
      setDescricao("");
      setValor("");
      setShowDespesaForm(false);
      load();
    } catch (e) {
      setError(e.message || "Não foi possível lançar a despesa.");
    } finally {
      setSavingDespesa(false);
    }
  };

  const removerDespesa = async (id) => {
    try {
      const res = await fetch(`/api/despesas/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      load();
    } catch {
      setError("Não foi possível remover a despesa.");
    }
  };

  const exportarCsv = () => {
    if (!report) return;
    const headers = ["Data", "Cliente", "Técnico", "Parceiro", "Pagamento", "Valor (R$)"];
    const rows = report.ordens.map((os) => [
      new Date(os.scheduledAt).toLocaleDateString("pt-BR", { timeZone: "UTC" }),
      os.cliente?.name || "",
      os.technician?.name || "",
      os.parceiro?.name || "",
      STATUS_LABELS[getStatusPagamento(os).status] || "",
      Number(os.value || 0).toFixed(2),
    ]);
    rows.push([]);
    rows.push(["Despesas do período"]);
    rows.push(["Descrição", "Categoria", "Data", "Valor (R$)"]);
    for (const d of report.despesas) {
      rows.push([d.descricao, d.categoria || "Outro", new Date(d.data).toLocaleDateString("pt-BR", { timeZone: "UTC" }), Number(d.valor || 0).toFixed(2)]);
    }
    downloadCsv(`financeiro_${from}_a_${to}.csv`, headers, rows);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-black uppercase tracking-tight text-[rgb(var(--ink-strong)/1)] text-xl">Financeiro</h1>
        {report && (
          <div className="print:hidden flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-[#142D65] text-[#F2EFE9] text-xs font-bold uppercase px-3 py-1.5 hover:bg-[#203D7B] transition-colors"
            >
              <Printer size={14} /> Imprimir / salvar PDF
            </button>
            <button
              onClick={exportarCsv}
              className="flex items-center gap-1.5 border-2 border-[rgb(var(--border-strong)/1)] text-[rgb(var(--ink-strong)/1)] text-xs font-bold uppercase px-3 py-1.5 hover:bg-[#142D65]/5 transition-colors"
            >
              <Download size={14} /> Exportar CSV
            </button>
          </div>
        )}
      </div>

      <div className="print:hidden flex flex-wrap gap-2 mb-5 bg-[rgb(var(--input-bg))] border border-[rgb(var(--border-strong)/0.2)] p-3">
        <div>
          <label className="text-[10px] font-bold uppercase text-[rgb(var(--ink))]">De</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="block border border-[rgb(var(--border-strong)/0.3)] px-2 py-1 text-sm outline-none focus:border-[#1E7A52]"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-[rgb(var(--ink))]">Até</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="block border border-[rgb(var(--border-strong)/0.3)] px-2 py-1 text-sm outline-none focus:border-[#1E7A52]"
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="text-[10px] font-bold uppercase text-[rgb(var(--ink))]">Técnico</label>
          <select
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
            className="block w-full border border-[rgb(var(--border-strong)/0.3)] px-2 py-1 text-sm outline-none focus:border-[#1E7A52]"
          >
            <option value="">Todos os técnicos</option>
            {tecnicos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 border border-[#A02018]/40 bg-[#A02018]/10 text-[#A02018] text-sm px-3 py-2 flex items-center justify-between">
          {error}
          <button onClick={() => setError("")} className="font-bold ml-3">
            ×
          </button>
        </div>
      )}

      {loading && <p className="text-sm text-[rgb(var(--ink))]">Carregando…</p>}

      {!loading && report && (
        <>
          <div className="grid sm:grid-cols-3 gap-3 mb-3">
            <div className="print:bg-white print:text-black print:border print:border-black bg-[#142D65] text-[#F2EFE9] p-3 flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[#8fb3ad] print:text-black">
                <Wallet size={12} /> Total faturado
              </span>
              <span className="font-mono font-black text-lg">{formatMoney(report.totais.totalFaturado)}</span>
              <span className="text-[10px] text-[#8fb3ad] print:text-black">{report.totais.quantidade} OS concluída(s)</span>
            </div>
            <div className="print:bg-white print:text-black print:border print:border-black bg-[#1E7A52] text-[#F2EFE9] p-3 flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide">
                <CheckCircle2 size={12} /> Pago
              </span>
              <span className="font-mono font-black text-lg">{formatMoney(report.totais.totalPago)}</span>
            </div>
            <div className="print:bg-white print:text-black print:border print:border-black bg-[#E8A33D] text-[#1a1208] p-3 flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide">
                <Clock size={12} /> Pendente
              </span>
              <span className="font-mono font-black text-lg">{formatMoney(report.totais.totalPendente)}</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div className="print:bg-white print:text-black print:border print:border-black bg-[#A02018] text-[#F2EFE9] p-3 flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide">
                <TrendingDown size={12} /> Despesas
              </span>
              <span className="font-mono font-black text-lg">{formatMoney(report.totais.totalDespesas)}</span>
            </div>
            <div
              className={`print:bg-white print:text-black print:border print:border-black p-3 flex flex-col gap-1 ${
                report.totais.saldo >= 0 ? "bg-[#3d4a44]" : "bg-[#A02018]"
              } text-[#F2EFE9]`}
            >
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide">
                <Scale size={12} /> Saldo líquido
              </span>
              <span className="font-mono font-black text-lg">{formatMoney(report.totais.saldo)}</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-[rgb(var(--input-bg))] border border-[rgb(var(--border-strong)/0.2)] p-3 flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[rgb(var(--stone))]">
                <Handshake size={12} /> Comissão paga a parceiros
              </span>
              <span className="font-mono font-black text-lg text-[#A02018]">
                {formatMoney(report.comissoes.pagaParceiros)}
              </span>
            </div>
            <div className="bg-[rgb(var(--input-bg))] border border-[rgb(var(--border-strong)/0.2)] p-3 flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[rgb(var(--stone))]">
                <Handshake size={12} /> Comissão recebida de parceiros
              </span>
              <span className="font-mono font-black text-lg text-[#1E7A52]">
                {formatMoney(report.comissoes.recebidaParceiros)}
              </span>
            </div>
            <div className="bg-[rgb(var(--input-bg))] border border-[rgb(var(--border-strong)/0.2)] p-3 flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[rgb(var(--stone))]">
                <Handshake size={12} /> Comissão paga a técnicos
              </span>
              <span className="font-mono font-black text-lg text-[#A02018]">
                {formatMoney(report.comissoes.pagaTecnicos)}
              </span>
            </div>
          </div>

          {Object.keys(report.porTecnico).length > 0 && (
            <div className="mb-6">
              <h2 className="font-black uppercase text-sm text-[rgb(var(--ink-strong)/1)] mb-2">Faturamento por técnico</h2>
              <div className="flex flex-col gap-1">
                {Object.entries(report.porTecnico).map(([nome, total]) => (
                  <div
                    key={nome}
                    className="flex items-center justify-between bg-[rgb(var(--input-bg)/0.60)] border border-[rgb(var(--border-strong)/0.15)] px-3 py-1.5 text-sm"
                  >
                    <span className="text-[rgb(var(--ink-strong)/1)]">{nome}</span>
                    <span className="font-mono font-bold text-[rgb(var(--ink-strong)/1)]">{formatMoney(total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(report.porParceiro).length > 0 && (
            <div className="mb-6">
              <h2 className="font-black uppercase text-sm text-[rgb(var(--ink-strong)/1)] mb-2">Faturamento por parceiro</h2>
              <div className="flex flex-col gap-1">
                {Object.entries(report.porParceiro).map(([nome, total]) => (
                  <div
                    key={nome}
                    className="flex items-center justify-between bg-[rgb(var(--input-bg)/0.60)] border border-[rgb(var(--border-strong)/0.15)] px-3 py-1.5 text-sm"
                  >
                    <span className="text-[rgb(var(--ink-strong)/1)]">{nome}</span>
                    <span className="font-mono font-bold text-[rgb(var(--ink-strong)/1)]">{formatMoney(total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-black uppercase text-sm text-[rgb(var(--ink-strong)/1)]">Despesas do período</h2>
              <button
                onClick={() => setShowDespesaForm((v) => !v)}
                className="print:hidden flex items-center gap-1 bg-[#A02018] text-[#F2EFE9] text-xs font-bold uppercase px-3 py-1.5 hover:bg-[#7A1812] transition-colors"
              >
                <Plus size={14} /> Lançar despesa
              </button>
            </div>

            {showDespesaForm && (
              <div className="bg-[rgb(var(--input-bg))] border-2 border-[rgb(var(--border-strong)/1)] p-3 mb-3 flex flex-col gap-2">
                <input
                  autoFocus
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descrição (ex: troca de óleo da van)"
                  className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
                />
                <div className="flex gap-2">
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] flex-1"
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="Valor (R$)"
                    className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] w-32"
                  />
                  <input
                    type="date"
                    value={dataDespesa}
                    onChange={(e) => setDataDespesa(e.target.value)}
                    className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
                  />
                </div>
                <button
                  onClick={addDespesa}
                  disabled={savingDespesa}
                  className="bg-[#A02018] text-[#F2EFE9] text-xs font-bold uppercase py-2 hover:bg-[#7A1812] transition-colors disabled:opacity-50"
                >
                  {savingDespesa ? "Salvando…" : "Salvar despesa"}
                </button>
              </div>
            )}

            {report.despesas.length === 0 ? (
              <EmptyState text="Nenhuma despesa lançada nesse período." />
            ) : (
              <div className="flex flex-col gap-1">
                {report.despesas.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between bg-[rgb(var(--input-bg)/0.60)] border border-[rgb(var(--border-strong)/0.15)] px-3 py-1.5 text-sm"
                  >
                    <div>
                      <p className="text-[rgb(var(--ink-strong)/1)]">{d.descricao}</p>
                      <p className="text-[11px] text-[rgb(var(--stone))]">
                        {d.categoria || "Outro"} — {new Date(d.data).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-[#A02018]">{formatMoney(d.valor)}</span>
                      <button
                        onClick={() => removerDespesa(d.id)}
                        className="print:hidden text-[rgb(var(--stone))] hover:text-[#A02018] transition-colors"
                        title="Remover despesa"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <h2 className="font-black uppercase text-sm text-[rgb(var(--ink-strong)/1)] mb-2">OS concluídas no período</h2>
          {report.ordens.length === 0 ? (
            <EmptyState text="Nenhuma OS concluída nesse período/filtro." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm bg-[rgb(var(--input-bg))] border border-[rgb(var(--border-strong)/0.2)]">
                <thead>
                  <tr className="bg-[#142D65]/5 text-left text-[11px] uppercase text-[rgb(var(--ink))]">
                    <th className="px-2 py-1.5">Data</th>
                    <th className="px-2 py-1.5">Cliente</th>
                    <th className="px-2 py-1.5">Técnico</th>
                    <th className="px-2 py-1.5">Pagamento</th>
                    <th className="px-2 py-1.5 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {report.ordens.map((os) => (
                    <tr key={os.id} className="border-t border-[rgb(var(--border-strong)/0.1)]">
                      <td className="px-2 py-1.5 font-mono text-xs">
                        {new Date(os.scheduledAt).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                      </td>
                      <td className="px-2 py-1.5">{os.cliente?.name}</td>
                      <td className="px-2 py-1.5">{os.technician?.name || "—"}</td>
                      <td className="px-2 py-1.5">
                        <span className={STATUS_CLASSES[getStatusPagamento(os).status]}>
                          {STATUS_LABELS[getStatusPagamento(os).status]}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono font-bold">{formatMoney(os.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
