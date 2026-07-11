"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Clock } from "lucide-react";
import Ticket from "@/components/Ticket";
import TicketActions from "@/components/TicketActions";
import EmptyState from "@/components/EmptyState";

export default function TecnicoClient() {
  const [osList, setOsList] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [showConcluded, setShowConcluded] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    try {
      const res = await fetch("/api/ordens");
      if (!res.ok) throw new Error();
      setOsList(await res.json());
    } catch {
      setError("Não foi possível carregar suas ordens de serviço.");
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const patchOs = async (id, url, body, errorMessage) => {
    setBusyId(id);
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || errorMessage);
      setOsList((prev) => prev.map((os) => (os.id === id ? json : os)));
    } catch (e) {
      setError(e.message || errorMessage);
    } finally {
      setBusyId(null);
    }
  };

  const handleAvancar = (id) => patchOs(id, `/api/ordens/${id}/avancar`, null, "Não foi possível avançar a OS.");
  const handleRecusar = (id, motivo) =>
    patchOs(id, `/api/ordens/${id}/recusar`, { motivo }, "Não foi possível recusar a OS.");
  const handleConcluir = (id, payload) =>
    patchOs(id, `/api/ordens/${id}/concluir`, payload, "Não foi possível concluir a OS.");
  const handleSalvarMateriais = (id, materiais) =>
    patchOs(id, `/api/ordens/${id}`, { materiais }, "Não foi possível salvar os materiais.");
  const handleSalvarAvaliacao = (id, avaliacaoNota) =>
    patchOs(id, `/api/ordens/${id}`, { avaliacaoNota }, "Não foi possível salvar a avaliação.");
  const handleFotoAdicionada = (id, foto) =>
    setOsList((prev) => prev.map((os) => (os.id === id ? { ...os, fotos: [...(os.fotos || []), foto] } : os)));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return osList
      .filter((os) => showConcluded || (os.status !== "concluida" && os.status !== "recusada"))
      .filter((os) => {
        if (!q) return true;
        return (
          os.cliente?.name?.toLowerCase().includes(q) ||
          os.cliente?.address?.toLowerCase().includes(q) ||
          os.serviceType?.toLowerCase().includes(q)
        );
      });
  }, [osList, query, showConcluded]);

  const openCount = osList.filter((os) => os.status !== "concluida" && os.status !== "recusada").length;

  if (!loaded) {
    return <div className="max-w-md mx-auto p-4 text-[rgb(var(--ink))] text-sm">Carregando…</div>;
  }

  return (
    <div className="max-w-md mx-auto p-4">
      {error && (
        <div className="mb-4 border border-[#A02018]/40 bg-[#A02018]/10 text-[#A02018] text-sm px-3 py-2 flex items-center justify-between">
          {error}
          <button onClick={() => setError("")} className="font-bold ml-3">
            ×
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 bg-[rgb(var(--input-bg)/0.70)] border border-[rgb(var(--border-strong)/0.2)] px-3 py-2 mb-3">
        <Search size={16} className="text-[rgb(var(--stone))]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por cliente, endereço ou serviço"
          className="bg-transparent outline-none text-sm flex-1 text-[rgb(var(--ink-strong)/1)] placeholder:text-[rgb(var(--stone))]"
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-[rgb(var(--ink))] flex items-center gap-1">
          <Clock size={12} /> {openCount} chamado(s) em aberto
        </p>
        <label className="flex items-center gap-1.5 text-xs text-[rgb(var(--ink))]">
          <input
            type="checkbox"
            checked={showConcluded}
            onChange={(e) => setShowConcluded(e.target.checked)}
          />
          Mostrar concluídas/recusadas
        </label>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <EmptyState text="Nenhum chamado encontrado para esse filtro." />
        )}
        {filtered.map((os) => (
          <Ticket
            key={os.id}
            os={os}
            compact
            actions={
              <TicketActions
                os={os}
                role="tecnico"
                isOwner
                tecnicos={[]}
                busy={busyId === os.id}
                onAvancar={handleAvancar}
                onRecusar={handleRecusar}
                onConcluir={handleConcluir}
                onSalvarMateriais={handleSalvarMateriais}
                onSalvarAvaliacao={handleSalvarAvaliacao}
                onFotoAdicionada={handleFotoAdicionada}
              />
            }
          />
        ))}
      </div>
    </div>
  );
}
