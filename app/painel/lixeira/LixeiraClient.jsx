"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";

function diasDesde(data) {
  const dias = Math.floor((Date.now() - new Date(data).getTime()) / (1000 * 60 * 60 * 24));
  if (dias <= 0) return "hoje";
  if (dias === 1) return "há 1 dia";
  return `há ${dias} dias`;
}

export default function LixeiraClient() {
  const [clientes, setClientes] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const carregar = async () => {
    try {
      const res = await fetch("/api/lixeira");
      if (!res.ok) throw new Error();
      const json = await res.json();
      setClientes(json.clientes);
      setOrdens(json.ordens);
    } catch {
      setError("Não foi possível carregar a lixeira.");
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const restaurarCliente = async (id) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/clientes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurar: true }),
      });
      if (!res.ok) throw new Error();
      setClientes((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("Não foi possível restaurar o cliente.");
    } finally {
      setBusyId(null);
    }
  };

  const excluirClienteDefinitivo = async (id) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível excluir o cliente.");
      setClientes((prev) => prev.filter((c) => c.id !== id));
      setConfirmId(null);
    } catch (e) {
      setError(e.message || "Não foi possível excluir o cliente.");
    } finally {
      setBusyId(null);
    }
  };

  const restaurarOs = async (id) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/ordens/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurar: true }),
      });
      if (!res.ok) throw new Error();
      setOrdens((prev) => prev.filter((o) => o.id !== id));
    } catch {
      setError("Não foi possível restaurar a ordem de serviço.");
    } finally {
      setBusyId(null);
    }
  };

  const excluirOsDefinitiva = async (id) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/ordens/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível excluir a ordem de serviço.");
      setOrdens((prev) => prev.filter((o) => o.id !== id));
      setConfirmId(null);
    } catch (e) {
      setError(e.message || "Não foi possível excluir a ordem de serviço.");
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

      <h1 className="font-black uppercase tracking-tight text-xl text-[rgb(var(--ink-strong)/1)] mb-4">Lixeira</h1>

      <h2 className="font-bold uppercase text-sm text-[rgb(var(--ink-strong)/1)] mb-2">
        Clientes <span className="text-[rgb(var(--stone))] font-normal">({clientes.length})</span>
      </h2>
      <div className="flex flex-col gap-2 mb-6">
        {clientes.length === 0 && <EmptyState text="Nenhum cliente na lixeira." />}
        {clientes.map((c) => (
          <div
            key={c.id}
            className="bg-[rgb(var(--input-bg)/0.60)] border border-[rgb(var(--border-strong)/0.2)] px-3 py-2 flex items-center justify-between gap-2"
          >
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[rgb(var(--ink-strong)/1)] text-sm truncate">{c.name}</p>
              <p className="text-xs text-[rgb(var(--stone))]">Excluído {diasDesde(c.deletedAt)}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={busyId === c.id}
                onClick={() => restaurarCliente(c.id)}
                className="flex items-center gap-1 text-[11px] font-bold text-[#1E7A52] hover:underline disabled:opacity-50"
                title="Restaurar cliente"
              >
                <RotateCcw size={13} /> Restaurar
              </button>
              {confirmId === c.id ? (
                <>
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
                    onClick={() => excluirClienteDefinitivo(c.id)}
                    className="text-[11px] font-bold text-[#A02018] hover:underline disabled:opacity-50"
                  >
                    Confirmar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(c.id)}
                  className="text-[rgb(var(--stone))] hover:text-[#A02018] transition-colors p-1"
                  title="Excluir definitivamente"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <h2 className="font-bold uppercase text-sm text-[rgb(var(--ink-strong)/1)] mb-2">
        Ordens de serviço <span className="text-[rgb(var(--stone))] font-normal">({ordens.length})</span>
      </h2>
      <div className="flex flex-col gap-2">
        {ordens.length === 0 && <EmptyState text="Nenhuma ordem de serviço na lixeira." />}
        {ordens.map((o) => (
          <div
            key={o.id}
            className="bg-[rgb(var(--input-bg)/0.60)] border border-[rgb(var(--border-strong)/0.2)] px-3 py-2 flex items-center justify-between gap-2"
          >
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[rgb(var(--ink-strong)/1)] text-sm truncate">
                {o.serviceType} — {o.cliente?.name}
              </p>
              <p className="text-xs text-[rgb(var(--stone))]">Excluída {diasDesde(o.deletedAt)}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={busyId === o.id}
                onClick={() => restaurarOs(o.id)}
                className="flex items-center gap-1 text-[11px] font-bold text-[#1E7A52] hover:underline disabled:opacity-50"
                title="Restaurar ordem de serviço"
              >
                <RotateCcw size={13} /> Restaurar
              </button>
              {confirmId === o.id ? (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    className="text-[11px] text-[rgb(var(--ink))] hover:text-[rgb(var(--ink-strong)/1)] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={busyId === o.id}
                    onClick={() => excluirOsDefinitiva(o.id)}
                    className="text-[11px] font-bold text-[#A02018] hover:underline disabled:opacity-50"
                  >
                    Confirmar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(o.id)}
                  className="text-[rgb(var(--stone))] hover:text-[#A02018] transition-colors p-1"
                  title="Excluir definitivamente"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
