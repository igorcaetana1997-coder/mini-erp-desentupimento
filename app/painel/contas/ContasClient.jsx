"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Pencil, Check, X, Landmark } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { formatMoeda } from "@/lib/formatMoeda";

function isAtrasada(dataStr, status) {
  if (!dataStr || status === "pago") return false;
  return new Date(dataStr) < new Date();
}

export default function ContasClient() {
  const [aba, setAba] = useState("pagar");

  const [despesas, setDespesas] = useState([]);
  const [contasReceber, setContasReceber] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [editando, setEditando] = useState(null);

  const load = async () => {
    try {
      const [resDespesas, resReceber] = await Promise.all([
        fetch("/api/despesas"),
        fetch("/api/contas-a-receber"),
      ]);
      if (!resDespesas.ok || !resReceber.ok) throw new Error();
      setDespesas(await resDespesas.json());
      setContasReceber(await resReceber.json());
    } catch {
      setError("Não foi possível carregar as contas.");
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const despesasOrdenadas = useMemo(() => {
    return [...despesas].sort((a, b) => {
      const va = a.vencimento ? new Date(a.vencimento).getTime() : Infinity;
      const vb = b.vencimento ? new Date(b.vencimento).getTime() : Infinity;
      return va - vb;
    });
  }, [despesas]);

  const addDespesa = async (data) => {
    setSaving(true);
    try {
      const res = await fetch("/api/despesas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao lançar despesa");
      setDespesas((prev) => [json, ...prev]);
      setShowForm(false);
    } catch (e) {
      setError(e.message || "Não foi possível lançar a despesa.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = async (id, data) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/despesas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar despesa");
      setDespesas((prev) => prev.map((d) => (d.id === id ? json : d)));
      setEditando(null);
    } catch (e) {
      setError(e.message || "Não foi possível salvar a despesa.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (despesa) => {
    setBusyId(despesa.id);
    try {
      const novoStatus = despesa.status === "pago" ? "pendente" : "pago";
      const res = await fetch(`/api/despesas/${despesa.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao atualizar status");
      setDespesas((prev) => prev.map((d) => (d.id === despesa.id ? json : d)));
    } catch (e) {
      setError(e.message || "Não foi possível atualizar o status.");
    } finally {
      setBusyId(null);
    }
  };

  const handleExcluir = async (id) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/despesas/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível excluir.");
      setDespesas((prev) => prev.filter((d) => d.id !== id));
      setConfirmId(null);
    } catch (e) {
      setError(e.message || "Não foi possível excluir a despesa.");
    } finally {
      setBusyId(null);
    }
  };

  const marcarRecebido = async (os) => {
    setBusyId(os.id);
    try {
      const res = await fetch(`/api/ordens/${os.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valorPago: os.value }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao marcar como pago");
      setContasReceber((prev) => prev.filter((o) => o.id !== os.id));
    } catch (e) {
      setError(e.message || "Não foi possível marcar como pago.");
    } finally {
      setBusyId(null);
    }
  };

  if (!loaded) {
    return <div className="max-w-3xl mx-auto p-6 text-[rgb(var(--ink))] text-sm">Carregando…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <Link
        href="/painel"
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-[rgb(var(--ink-strong)/1)] mb-4 hover:underline"
      >
        <ArrowLeft size={14} /> Voltar ao painel
      </Link>

      {error && (
        <div className="mb-4 border border-[#A02018]/40 bg-[#A02018]/10 text-[#A02018] text-sm px-3 py-2 flex items-center justify-between">
          {error}
          <button onClick={() => setError("")} className="font-bold ml-3">
            ×
          </button>
        </div>
      )}

      <h1 className="font-black uppercase tracking-tight text-xl text-[rgb(var(--ink-strong)/1)] flex items-center gap-2 mb-3">
        <Landmark size={20} /> Contas
      </h1>

      <div className="flex gap-1 bg-[rgb(var(--input-bg)/0.60)] p-1 mb-4 w-fit">
        <button
          onClick={() => setAba("pagar")}
          className={`px-4 py-1.5 text-xs font-bold uppercase transition-colors ${
            aba === "pagar" ? "bg-[#1E7A52] text-[#F2EFE9]" : "text-[rgb(var(--ink))]"
          }`}
        >
          A Pagar ({despesas.length})
        </button>
        <button
          onClick={() => setAba("receber")}
          className={`px-4 py-1.5 text-xs font-bold uppercase transition-colors ${
            aba === "receber" ? "bg-[#1E7A52] text-[#F2EFE9]" : "text-[rgb(var(--ink))]"
          }`}
        >
          A Receber ({contasReceber.length})
        </button>
      </div>

      {aba === "pagar" && (
        <>
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 bg-[#1E7A52] text-[#F2EFE9] text-xs font-bold uppercase px-3 py-1.5 hover:bg-[#175F40] transition-colors"
            >
              <Plus size={14} /> Nova despesa
            </button>
          </div>

          {showForm && <DespesaForm saving={saving} onSave={addDespesa} onCancel={() => setShowForm(false)} />}

          <div className="flex flex-col gap-2">
            {despesas.length === 0 && !showForm && <EmptyState text="Nenhuma conta a pagar lançada ainda." />}
            {despesasOrdenadas.map((d) => {
              const atrasada = isAtrasada(d.vencimento, d.status);
              return (
                <div
                  key={d.id}
                  className={`bg-[rgb(var(--input-bg)/0.60)] border px-3 py-2 flex items-center justify-between gap-2 ${
                    atrasada ? "border-[#A02018]/50" : "border-[rgb(var(--border-strong)/0.2)]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[rgb(var(--ink-strong)/1)] text-sm truncate">
                      {d.descricao}{" "}
                      {d.status === "pago" ? (
                        <span className="text-[10px] font-bold uppercase text-[#1E7A52]">Paga</span>
                      ) : atrasada ? (
                        <span className="text-[10px] font-bold uppercase text-[#A02018]">Atrasada</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-[rgb(var(--ink))]">
                      R$ {formatMoeda(d.valor)} {d.categoria ? `· ${d.categoria}` : ""}
                    </p>
                    {d.vencimento && (
                      <p className="text-xs text-[rgb(var(--stone))]">
                        Vencimento: {new Date(d.vencimento).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                      </p>
                    )}
                  </div>
                  {confirmId === d.id ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="text-[11px] text-[rgb(var(--ink))] hover:text-[rgb(var(--ink-strong)/1)] transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={busyId === d.id}
                        onClick={() => handleExcluir(d.id)}
                        className="text-[11px] font-bold text-[#A02018] hover:underline disabled:opacity-50"
                      >
                        Confirmar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={busyId === d.id}
                        onClick={() => toggleStatus(d)}
                        title={d.status === "pago" ? "Marcar como pendente" : "Marcar como paga"}
                        className={`p-1 transition-colors disabled:opacity-50 ${
                          d.status === "pago"
                            ? "text-[#1E7A52]"
                            : "text-[rgb(var(--stone))] hover:text-[#1E7A52]"
                        }`}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditando(d)}
                        className="text-[rgb(var(--stone))] hover:text-[#142D65] transition-colors p-1"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(d.id)}
                        className="text-[rgb(var(--stone))] hover:text-[#A02018] transition-colors p-1"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {aba === "receber" && (
        <div className="flex flex-col gap-2">
          {contasReceber.length === 0 && <EmptyState text="Nenhuma conta a receber pendente." />}
          {contasReceber.map((os) => {
            const atrasada = isAtrasada(os.dueDate, os.status);
            return (
              <div
                key={os.id}
                className={`bg-[rgb(var(--input-bg)/0.60)] border px-3 py-2 flex items-center justify-between gap-2 ${
                  atrasada ? "border-[#A02018]/50" : "border-[rgb(var(--border-strong)/0.2)]"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[rgb(var(--ink-strong)/1)] text-sm truncate">
                    {os.cliente?.name || "Cliente"}{" "}
                    {atrasada && <span className="text-[10px] font-bold uppercase text-[#A02018]">Atrasada</span>}
                  </p>
                  <p className="text-xs text-[rgb(var(--ink))]">
                    {os.serviceType} · Falta R$ {formatMoeda(os.faltante)} de R$ {formatMoeda(os.value)}
                  </p>
                  {os.dueDate && (
                    <p className="text-xs text-[rgb(var(--stone))]">
                      Vencimento: {new Date(os.dueDate).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={busyId === os.id}
                  onClick={() => marcarRecebido(os)}
                  className="shrink-0 text-[11px] font-bold uppercase text-[#1E7A52] hover:underline disabled:opacity-50"
                >
                  Marcar como pago
                </button>
              </div>
            );
          })}
        </div>
      )}

      {editando && (
        <EditarDespesaModal
          despesa={editando}
          saving={saving}
          onConfirm={(data) => handleEditar(editando.id, data)}
          onCancel={() => setEditando(null)}
        />
      )}
    </div>
  );
}

function DespesaForm({ onSave, onCancel, saving }) {
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [vencimento, setVencimento] = useState("");

  const submit = () => {
    if (!descricao.trim() || !valor) return;
    onSave({ descricao: descricao.trim(), categoria: categoria.trim(), valor, data, vencimento: vencimento || null });
  };

  return (
    <div className="bg-[rgb(var(--input-bg))] border-2 border-[rgb(var(--border-strong)/1)] p-3 mb-3 flex flex-col gap-2">
      <p className="font-bold text-[rgb(var(--ink-strong)/1)] text-sm uppercase">Nova conta a pagar</p>
      <input
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="Descrição"
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
      />
      <input
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        placeholder="Categoria (opcional)"
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
      />
      <input
        type="number"
        step="0.01"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Valor"
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
      />
      <label className="text-xs text-[rgb(var(--stone))]">
        Data
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="mt-1 w-full border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
        />
      </label>
      <label className="text-xs text-[rgb(var(--stone))]">
        Vencimento (opcional)
        <input
          type="date"
          value={vencimento}
          onChange={(e) => setVencimento(e.target.value)}
          className="mt-1 w-full border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
        />
      </label>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          type="button"
          className="flex-1 border border-[rgb(var(--border-strong)/0.3)] text-[rgb(var(--ink-strong)/1)] text-xs font-bold uppercase py-2 hover:bg-[#142D65]/5 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={submit}
          disabled={saving}
          type="button"
          className="flex-1 bg-[#1E7A52] text-[#F2EFE9] text-xs font-bold uppercase py-2 hover:bg-[#175F40] transition-colors disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </div>
  );
}

function EditarDespesaModal({ despesa, onConfirm, onCancel, saving }) {
  const [descricao, setDescricao] = useState(despesa.descricao);
  const [categoria, setCategoria] = useState(despesa.categoria || "");
  const [valor, setValor] = useState(despesa.valor);
  const [vencimento, setVencimento] = useState(despesa.vencimento ? despesa.vencimento.slice(0, 10) : "");

  const submit = () => {
    if (!descricao.trim() || !valor) return;
    onConfirm({ descricao: descricao.trim(), categoria: categoria.trim(), valor, vencimento: vencimento || null });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[rgb(var(--surface))] border-2 border-[rgb(var(--border-strong)/1)] w-full max-w-md p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="font-black uppercase text-[rgb(var(--ink-strong)/1)]">Editar conta a pagar</p>
          <button onClick={onCancel} type="button">
            <X size={18} className="text-[rgb(var(--stone))]" />
          </button>
        </div>
        <input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição"
          className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
        />
        <input
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          placeholder="Categoria (opcional)"
          className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
        />
        <input
          type="number"
          step="0.01"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Valor"
          className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
        />
        <label className="text-xs text-[rgb(var(--stone))]">
          Vencimento (opcional)
          <input
            type="date"
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
            className="mt-1 w-full border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
          />
        </label>
        <button
          onClick={submit}
          disabled={saving}
          type="button"
          className="mt-1 bg-[#142D65] text-[#F2EFE9] text-xs font-bold uppercase py-2.5 hover:bg-[#203D7B] transition-colors disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}
