"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Search } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import OrcamentoForm from "@/components/OrcamentoForm";
import { formatMoeda } from "@/lib/formatMoeda";

const ORCAMENTO_STATUS_CLASSES = {
  pendente: "bg-[#E8A33D]/15 text-[#E8A33D]",
  aprovado: "bg-[#1E7A52]/15 text-[#1E7A52]",
  recusado: "bg-[#A02018]/15 text-[#A02018]",
};

const ORCAMENTO_STATUS_LABELS = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

export default function OrcamentosClient() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [clients, setClients] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [orcamentosRes, clientesRes] = await Promise.all([
          fetch("/api/orcamentos"),
          fetch("/api/clientes"),
        ]);
        if (!orcamentosRes.ok || !clientesRes.ok) throw new Error();
        setOrcamentos(await orcamentosRes.json());
        setClients(await clientesRes.json());
      } catch {
        setError("Não foi possível carregar os orçamentos.");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const addOrcamento = async (data) => {
    setSaving(true);
    try {
      const res = await fetch("/api/orcamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar orçamento");
      setOrcamentos((prev) => [json, ...prev]);
      setShowForm(false);
    } catch (e) {
      setError(e.message || "Não foi possível salvar o orçamento.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orcamentos;
    return orcamentos.filter((o) => {
      return (
        o.cliente?.name?.toLowerCase().includes(q) ||
        o.serviceType?.toLowerCase().includes(q)
      );
    });
  }, [orcamentos, query]);

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

      <div className="flex items-center justify-between mb-3">
        <h1 className="font-black uppercase tracking-tight text-xl text-[rgb(var(--ink-strong)/1)]">
          Orçamentos <span className="text-[rgb(var(--stone))] font-normal">({filtered.length})</span>
        </h1>
        <button
          onClick={() => setShowForm(true)}
          disabled={clients.length === 0}
          className="flex items-center gap-1 bg-[#1E7A52] text-[#F2EFE9] text-xs font-bold uppercase px-3 py-1.5 hover:bg-[#175F40] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FileText size={14} /> Novo
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-md my-4">
            <OrcamentoForm
              clients={clients}
              saving={saving}
              onSave={addOrcamento}
              onCancel={() => setShowForm(false)}
              onClienteCriado={(c) => setClients((prev) => [c, ...prev])}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 bg-[rgb(var(--input-bg)/0.70)] border border-[rgb(var(--border-strong)/0.2)] px-3 py-2 mb-3">
        <Search size={16} className="text-[rgb(var(--stone))]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por cliente ou tipo de serviço"
          className="bg-transparent outline-none text-sm flex-1 text-[rgb(var(--ink-strong)/1)] placeholder:text-[rgb(var(--stone))]"
        />
      </div>

      <div className="flex flex-col gap-2">
        {orcamentos.length === 0 && !showForm && (
          <EmptyState text="Nenhum orçamento criado ainda. Clique em Novo para começar." />
        )}
        {orcamentos.length > 0 && filtered.length === 0 && (
          <EmptyState text="Nenhum orçamento encontrado para esse filtro." />
        )}
        {filtered.map((o) => (
          <Link
            key={o.id}
            href={`/painel/orcamentos/${o.id}`}
            className="bg-[rgb(var(--input-bg)/0.60)] border border-[rgb(var(--border-strong)/0.2)] px-3 py-2 flex items-center justify-between gap-2 hover:bg-[rgb(var(--input-bg))] transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[rgb(var(--ink-strong)/1)] text-sm truncate">{o.cliente?.name}</p>
              <p className="text-xs text-[rgb(var(--ink))] truncate">{o.serviceType}</p>
              <p className="text-xs text-[rgb(var(--stone))]">R$ {formatMoeda(o.value)}</p>
            </div>
            <span
              className={`shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 ${ORCAMENTO_STATUS_CLASSES[o.status]}`}
            >
              {ORCAMENTO_STATUS_LABELS[o.status]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
