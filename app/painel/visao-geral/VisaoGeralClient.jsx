"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Wallet,
  Clock,
  Ticket as TicketIcon,
  CheckCircle2,
  Inbox,
  Wrench,
  Download,
  Settings2,
  Plus,
  Trash2,
  AlertTriangle,
  Cake,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { downloadCsv } from "@/lib/exportCsv";
import { formatMoeda } from "@/lib/formatMoeda";

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMoney(n) {
  return `R$ ${formatMoeda(n)}`;
}

const DIAS_ALERTA_STORAGE_KEY = "visaoGeral.diasAlerta";

function diasAlertaInicial() {
  if (typeof window === "undefined") return 15;
  const salvo = Number(localStorage.getItem(DIAS_ALERTA_STORAGE_KEY));
  return salvo > 0 ? salvo : 15;
}

export default function VisaoGeralClient() {
  const [mes, setMes] = useState(mesAtual);
  const [diasAlerta, setDiasAlerta] = useState(diasAlertaInicial);
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [faixas, setFaixas] = useState([]);
  const [showFaixas, setShowFaixas] = useState(false);
  const [novoMinValor, setNovoMinValor] = useState("");
  const [novoPercentual, setNovoPercentual] = useState("");
  const [savingFaixa, setSavingFaixa] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/relatorios/dashboard?month=${mes}&diasAlerta=${diasAlerta}`);
      if (!res.ok) throw new Error();
      setDados(await res.json());
    } catch {
      setError("Não foi possível carregar a visão geral.");
    } finally {
      setLoading(false);
    }
  }, [mes, diasAlerta]);

  const alterarDiasAlerta = (valor) => {
    const n = Number(valor);
    if (!Number.isFinite(n) || n <= 0) return;
    setDiasAlerta(n);
    localStorage.setItem(DIAS_ALERTA_STORAGE_KEY, String(n));
  };

  const loadFaixas = useCallback(async () => {
    try {
      const res = await fetch("/api/faixas-comissao");
      if (!res.ok) throw new Error();
      setFaixas(await res.json());
    } catch {
      setError("Não foi possível carregar as faixas de comissão.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadFaixas();
  }, [loadFaixas]);

  const addFaixa = async () => {
    if (novoMinValor === "" || novoPercentual === "") return;
    setSavingFaixa(true);
    try {
      const res = await fetch("/api/faixas-comissao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minValor: novoMinValor, percentual: novoPercentual }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar faixa");
      setNovoMinValor("");
      setNovoPercentual("");
      await loadFaixas();
      load();
    } catch (e) {
      setError(e.message || "Não foi possível salvar a faixa.");
    } finally {
      setSavingFaixa(false);
    }
  };

  const removerFaixa = async (id) => {
    try {
      const res = await fetch(`/api/faixas-comissao/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await loadFaixas();
      load();
    } catch {
      setError("Não foi possível remover a faixa.");
    }
  };

  const exportarRanking = (tipo) => {
    if (!dados) return;
    if (tipo === "tecnicos") {
      const headers = ["Técnico", "Faturado no mês (R$)", "Faixa (%)", "Comissão (R$)"];
      const rows = dados.rankingTecnicos.map((t) => [
        t.nome,
        t.total.toFixed(2),
        t.percentual ?? "",
        t.comissao.toFixed(2),
      ]);
      downloadCsv(`producao_tecnicos_${mes}.csv`, headers, rows);
    } else {
      const headers = ["Parceiro", "Tipo", "Faturado no mês (R$)", "Comissão (R$)"];
      const rows = dados.rankingParceiros.map((p) => [
        p.nome,
        p.tipo === "repassado" ? "Repassado (recebo)" : "Recebido (pago)",
        p.total.toFixed(2),
        (p.comissao || 0).toFixed(2),
      ]);
      downloadCsv(`producao_parceiros_${mes}.csv`, headers, rows);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="font-black uppercase tracking-tight text-[rgb(var(--ink-strong)/1)] text-xl">Visão Geral</h1>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-[rgb(var(--ink))]">
            Alertar pagamento pendente após
            <select
              value={diasAlerta}
              onChange={(e) => alterarDiasAlerta(e.target.value)}
              className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] bg-[rgb(var(--input-bg))]"
            >
              {[7, 15, 30, 60].map((d) => (
                <option key={d} value={d}>
                  {d} dias
                </option>
              ))}
            </select>
          </label>
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] bg-[rgb(var(--input-bg))]"
          />
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

      {!loading && dados && (
        <>
          <div className="grid sm:grid-cols-3 gap-3 mb-3">
            <div className="bg-[rgb(var(--input-bg))] border border-[rgb(var(--border-strong)/0.2)] p-3 flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[rgb(var(--stone))]">
                <Inbox size={12} /> OS em aberto
              </span>
              <span className="font-mono font-black text-lg text-[rgb(var(--ink-strong)/1)]">{dados.pipeline.abertas}</span>
            </div>
            <div className="bg-[rgb(var(--input-bg))] border border-[rgb(var(--border-strong)/0.2)] p-3 flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[rgb(var(--stone))]">
                <Wrench size={12} /> Em andamento
              </span>
              <span className="font-mono font-black text-lg text-[rgb(var(--ink-strong)/1)]">{dados.pipeline.andamento}</span>
            </div>
            <div className="bg-[rgb(var(--input-bg))] border border-[rgb(var(--border-strong)/0.2)] p-3 flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[rgb(var(--stone))]">
                <CheckCircle2 size={12} /> Taxa de conclusão
              </span>
              <span className="font-mono font-black text-lg text-[rgb(var(--ink-strong)/1)]">
                {dados.periodo.taxaConclusao != null ? `${(dados.periodo.taxaConclusao * 100).toFixed(0)}%` : "—"}
              </span>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-[#1E7A52] text-[#F2EFE9] p-3 flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide">
                <Wallet size={12} /> Faturamento pago no mês
              </span>
              <span className="font-mono font-black text-lg">{formatMoney(dados.periodo.faturamentoPago)}</span>
            </div>
            <div className="bg-[#E8A33D] text-[#1a1208] p-3 flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide">
                <Clock size={12} /> Faturamento pendente
              </span>
              <span className="font-mono font-black text-lg">{formatMoney(dados.periodo.faturamentoPendente)}</span>
            </div>
            <div className="bg-[#142D65] text-[#F2EFE9] p-3 flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[#9fb0d6]">
                <TicketIcon size={12} /> Ticket médio
              </span>
              <span className="font-mono font-black text-lg">{formatMoney(dados.periodo.ticketMedio)}</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            <div>
              <h2 className="flex items-center gap-1.5 font-black uppercase text-sm text-[rgb(var(--ink-strong)/1)] mb-2">
                <AlertTriangle size={14} /> Pagamentos pendentes antigos
              </h2>
              {dados.alertaPagamentos.itens.length === 0 ? (
                <EmptyState text={`Nenhum pagamento pendente há mais de ${dados.alertaPagamentos.diasAlerta} dias.`} />
              ) : (
                <div className="flex flex-col gap-1.5">
                  {dados.alertaPagamentos.itens.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#E8A33D]/10 border border-[#E8A33D]/40 px-3 py-2 flex items-center justify-between gap-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[rgb(var(--ink-strong)/1)] truncate">{item.cliente}</p>
                        <p className="text-[11px] text-[rgb(var(--stone))] truncate">{item.serviceType}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono font-bold text-[#A02018]">{formatMoney(item.faltante)}</p>
                        <p className="text-[11px] text-[rgb(var(--stone))]">há {item.diasAtraso} dias</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="flex items-center gap-1.5 font-black uppercase text-sm text-[rgb(var(--ink-strong)/1)] mb-2">
                <Cake size={14} /> Próximos aniversários
              </h2>
              {dados.proximosAniversarios.length === 0 ? (
                <EmptyState text="Nenhum aniversário nos próximos 30 dias." />
              ) : (
                <div className="flex flex-col gap-1.5">
                  {dados.proximosAniversarios.map((c) => (
                    <div
                      key={c.id}
                      className="bg-[rgb(var(--input-bg))] border border-[rgb(var(--border-strong)/0.2)] px-3 py-2 flex items-center justify-between gap-2 text-sm"
                    >
                      <p className="font-bold text-[rgb(var(--ink-strong)/1)] truncate">{c.nome}</p>
                      <p className="text-[11px] text-[rgb(var(--stone))] shrink-0">
                        {c.data} · {c.diasAte === 0 ? "hoje" : `em ${c.diasAte}d`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-black uppercase text-sm text-[rgb(var(--ink-strong)/1)]">Produção por técnico</h2>
              {dados.rankingTecnicos.length > 0 && (
                <button
                  onClick={() => exportarRanking("tecnicos")}
                  className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-[rgb(var(--ink-strong)/1)] hover:underline"
                >
                  <Download size={12} /> Exportar CSV
                </button>
              )}
            </div>
            {dados.rankingTecnicos.length === 0 ? (
              <EmptyState text="Nenhuma OS concluída no mês selecionado." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm bg-[rgb(var(--input-bg))] border border-[rgb(var(--border-strong)/0.2)]">
                  <thead>
                    <tr className="bg-[#142D65]/5 text-left text-[11px] uppercase text-[rgb(var(--ink))]">
                      <th className="px-2 py-1.5">Técnico</th>
                      <th className="px-2 py-1.5 text-right">Faturado</th>
                      <th className="px-2 py-1.5 text-right">Faixa</th>
                      <th className="px-2 py-1.5 text-right">Comissão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.rankingTecnicos.map((t) => (
                      <tr key={t.nome} className="border-t border-[rgb(var(--border-strong)/0.1)]">
                        <td className="px-2 py-1.5">{t.nome}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{formatMoney(t.total)}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-[rgb(var(--stone))]">
                          {t.percentual != null ? `${t.percentual}%` : "—"}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono font-bold">{formatMoney(t.comissao)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-black uppercase text-sm text-[rgb(var(--ink-strong)/1)]">Produção por parceiro</h2>
              {dados.rankingParceiros.length > 0 && (
                <button
                  onClick={() => exportarRanking("parceiros")}
                  className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-[rgb(var(--ink-strong)/1)] hover:underline"
                >
                  <Download size={12} /> Exportar CSV
                </button>
              )}
            </div>
            {dados.rankingParceiros.length === 0 ? (
              <EmptyState text="Nenhuma OS terceirizada concluída no mês selecionado." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm bg-[rgb(var(--input-bg))] border border-[rgb(var(--border-strong)/0.2)]">
                  <thead>
                    <tr className="bg-[#142D65]/5 text-left text-[11px] uppercase text-[rgb(var(--ink))]">
                      <th className="px-2 py-1.5">Parceiro</th>
                      <th className="px-2 py-1.5">Tipo</th>
                      <th className="px-2 py-1.5 text-right">Faturado</th>
                      <th className="px-2 py-1.5 text-right">Comissão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.rankingParceiros.map((p) => (
                      <tr key={p.nome} className="border-t border-[rgb(var(--border-strong)/0.1)]">
                        <td className="px-2 py-1.5">{p.nome}</td>
                        <td className="px-2 py-1.5 text-[rgb(var(--stone))]">
                          {p.tipo === "repassado" ? "Repassado (recebo)" : "Recebido (pago)"}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono">{formatMoney(p.total)}</td>
                        <td className="px-2 py-1.5 text-right font-mono font-bold">{formatMoney(p.comissao)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <div className="border-t border-dashed border-[rgb(var(--border-strong)/0.3)] pt-4">
        <button
          onClick={() => setShowFaixas((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-bold uppercase text-[rgb(var(--ink-strong)/1)] hover:underline"
        >
          <Settings2 size={14} /> Configurar faixas de comissão do técnico
        </button>

        {showFaixas && (
          <div className="mt-3 bg-[rgb(var(--input-bg))] border border-[rgb(var(--border-strong)/0.2)] p-3">
            <p className="text-xs text-[rgb(var(--ink))] mb-2">
              A faixa atingida pelo faturamento do técnico no período vale sobre todo o valor faturado (não é
              progressivo). Ex.: faturou a partir de R$5.000 → aplica o percentual dessa faixa em cima do total.
            </p>
            <div className="flex flex-col gap-1 mb-3">
              {faixas.length === 0 && <EmptyState text="Nenhuma faixa configurada ainda." />}
              {faixas.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between bg-[rgb(var(--page-bg))] px-3 py-1.5 text-sm"
                >
                  <span className="text-[rgb(var(--ink-strong)/1)]">A partir de {formatMoney(f.minValor)}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-[rgb(var(--ink-strong)/1)]">{f.percentual}%</span>
                    <button
                      onClick={() => removerFaixa(f.id)}
                      className="text-[rgb(var(--stone))] hover:text-[#A02018] transition-colors"
                      title="Remover faixa"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={novoMinValor}
                onChange={(e) => setNovoMinValor(e.target.value)}
                placeholder="A partir de (R$)"
                className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] flex-1"
              />
              <input
                type="number"
                value={novoPercentual}
                onChange={(e) => setNovoPercentual(e.target.value)}
                placeholder="Percentual (%)"
                className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] w-32"
              />
              <button
                onClick={addFaixa}
                disabled={savingFaixa}
                className="flex items-center gap-1 bg-[#1E7A52] text-[#F2EFE9] text-xs font-bold uppercase px-3 py-1.5 hover:bg-[#175F40] transition-colors disabled:opacity-50"
              >
                <Plus size={14} /> Adicionar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
