"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ClientForm from "@/components/ClientForm";
import { formatEndereco } from "@/lib/formatEndereco";

export default function ClientesClient() {
  const [clients, setClients] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/clientes");
        if (!res.ok) throw new Error();
        setClients(await res.json());
      } catch {
        setError("Não foi possível carregar os clientes.");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const addClient = async (data) => {
    setSaving(true);
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setClients((prev) => [created, ...prev]);
      setShowForm(false);
    } catch {
      setError("Não foi possível salvar o cliente.");
    } finally {
      setSaving(false);
    }
  };

  const handleExcluir = async (id) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível excluir o cliente.");
      setClients((prev) => prev.filter((c) => c.id !== id));
      setConfirmId(null);
    } catch (e) {
      setError(e.message || "Não foi possível excluir o cliente.");
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

      <div className="flex items-center justify-between mb-3">
        <h1 className="font-black uppercase tracking-tight text-xl text-[rgb(var(--ink-strong)/1)]">
          Clientes <span className="text-[rgb(var(--stone))] font-normal">({clients.length})</span>
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 bg-[#1E7A52] text-[#F2EFE9] text-xs font-bold uppercase px-3 py-1.5 hover:bg-[#175F40] transition-colors"
        >
          <Plus size={14} /> Novo
        </button>
      </div>

      {showForm && <ClientForm saving={saving} onSave={addClient} onCancel={() => setShowForm(false)} />}

      <div className="flex flex-col gap-2">
        {clients.length === 0 && !showForm && (
          <EmptyState text="Nenhum cliente cadastrado ainda. Clique em Novo para começar." />
        )}
        {clients.map((c) => (
          <div
            key={c.id}
            className="bg-[rgb(var(--input-bg)/0.60)] border border-[rgb(var(--border-strong)/0.2)] px-3 py-2 flex items-center justify-between gap-2 hover:bg-[rgb(var(--input-bg))] transition-colors"
          >
            <Link href={`/painel/clientes/${c.id}`} className="min-w-0 flex-1">
              <p className="font-bold text-[rgb(var(--ink-strong)/1)] text-sm truncate">{c.name}</p>
              <p className="text-xs text-[rgb(var(--ink))]">{c.phone}</p>
              {formatEndereco(c) && <p className="text-xs text-[rgb(var(--stone))] truncate">{formatEndereco(c)}</p>}
            </Link>
            {confirmId === c.id ? (
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
                  disabled={busyId === c.id}
                  onClick={() => handleExcluir(c.id)}
                  className="text-[11px] font-bold text-[#A02018] hover:underline disabled:opacity-50"
                >
                  Confirmar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmId(c.id)}
                className="shrink-0 text-[rgb(var(--stone))] hover:text-[#A02018] transition-colors p-1"
                title="Excluir cliente"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
