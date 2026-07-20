"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, History } from "lucide-react";
import EmptyState from "@/components/EmptyState";

const ACTION_LABEL = {
  create: "Criação",
  update: "Edição",
  delete: "Exclusão",
  status: "Mudança de status",
};

export default function AuditoriaClient() {
  const [logs, setLogs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auditoria");
        if (!res.ok) throw new Error();
        setLogs(await res.json());
      } catch {
        setError("Não foi possível carregar o log de auditoria.");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) => {
      return (
        l.userName?.toLowerCase().includes(q) ||
        l.entity?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q)
      );
    });
  }, [logs, query]);

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
        <h1 className="font-black uppercase tracking-tight text-xl text-[rgb(var(--ink-strong)/1)] flex items-center gap-2">
          <History size={20} /> Auditoria <span className="text-[rgb(var(--stone))] font-normal">({filtered.length})</span>
        </h1>
      </div>

      <p className="text-xs text-[rgb(var(--stone))] mb-3">
        Histórico de quem criou, editou ou excluiu registros no sistema. Mostra as {logs.length >= 100 ? "últimas 100" : "últimas"} ações.
      </p>

      <div className="flex items-center gap-2 bg-[rgb(var(--input-bg)/0.70)] border border-[rgb(var(--border-strong)/0.2)] px-3 py-2 mb-3">
        <Search size={16} className="text-[rgb(var(--stone))]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por usuário, entidade ou descrição"
          className="bg-transparent outline-none text-sm flex-1 text-[rgb(var(--ink-strong)/1)] placeholder:text-[rgb(var(--stone))]"
        />
      </div>

      <div className="flex flex-col gap-2">
        {logs.length === 0 && <EmptyState text="Nenhuma ação registrada ainda." />}
        {logs.length > 0 && filtered.length === 0 && (
          <EmptyState text="Nenhum registro encontrado para esse filtro." />
        )}
        {filtered.map((l) => (
          <div
            key={l.id}
            className="bg-[rgb(var(--input-bg)/0.60)] border border-[rgb(var(--border-strong)/0.2)] px-3 py-2 flex items-start justify-between gap-2"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[rgb(var(--ink-strong)/1)]">{l.description}</p>
              <p className="text-xs text-[rgb(var(--stone))]">
                {l.userName} ({l.userRole}) · {new Date(l.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
            <span className="shrink-0 text-[10px] font-bold uppercase px-2 py-1 bg-[rgb(var(--border-strong)/0.15)] text-[rgb(var(--ink))]">
              {ACTION_LABEL[l.action] || l.action}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
