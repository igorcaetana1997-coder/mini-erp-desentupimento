"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import Ticket from "@/components/Ticket";
import TicketActions from "@/components/TicketActions";

export default function OrdensClient() {
  const [osList, setOsList] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [parceiros, setParceiros] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [ordensRes, tecnicosRes, parceirosRes] = await Promise.all([
          fetch("/api/ordens"),
          fetch("/api/tecnicos"),
          fetch("/api/parceiros"),
        ]);
        if (!ordensRes.ok || !tecnicosRes.ok || !parceirosRes.ok) throw new Error();
        setOsList(await ordensRes.json());
        setTecnicos(await tecnicosRes.json());
        setParceiros(await parceirosRes.json());
      } catch {
        setError("Não foi possível carregar as ordens de serviço.");
      } finally {
        setLoaded(true);
      }
    })();
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
  const handleReabrir = (id, technicianId) =>
    patchOs(id, `/api/ordens/${id}`, { status: "aberta", technicianId }, "Não foi possível reabrir a OS.");
  const handleSalvarMateriais = (id, materiais) =>
    patchOs(id, `/api/ordens/${id}`, { materiais }, "Não foi possível salvar os materiais.");
  const handleSalvarAvaliacao = (id, avaliacaoNota) =>
    patchOs(id, `/api/ordens/${id}`, { avaliacaoNota }, "Não foi possível salvar a avaliação.");
  const handleFotoAdicionada = (id, foto) =>
    setOsList((prev) => prev.map((os) => (os.id === id ? { ...os, fotos: [...(os.fotos || []), foto] } : os)));
  const handleRegistrarPagamento = (id, valorPago) =>
    patchOs(id, `/api/ordens/${id}`, { valorPago }, "Não foi possível registrar o pagamento.");
  const handleEditarOs = (id, payload) =>
    patchOs(id, `/api/ordens/${id}`, payload, "Não foi possível salvar as alterações da OS.");

  const handleExcluir = async (id) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/ordens/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível excluir a OS.");
      setOsList((prev) => prev.filter((os) => os.id !== id));
    } catch (e) {
      setError(e.message || "Não foi possível excluir a OS.");
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

      <h1 className="font-black uppercase tracking-tight text-xl text-[rgb(var(--ink-strong)/1)] mb-3">
        Ordens de serviço <span className="text-[rgb(var(--stone))] font-normal">({osList.length})</span>
      </h1>

      <div className="flex flex-col gap-3">
        {osList.length === 0 && <EmptyState text="Nenhuma ordem de serviço cadastrada." />}
        {osList.map((os) => (
          <Ticket
            key={os.id}
            os={os}
            actions={
              <TicketActions
                os={os}
                role="admin"
                isOwner={false}
                tecnicos={tecnicos}
                parceiros={parceiros}
                busy={busyId === os.id}
                onAvancar={handleAvancar}
                onRecusar={handleRecusar}
                onConcluir={handleConcluir}
                onReabrir={handleReabrir}
                onSalvarMateriais={handleSalvarMateriais}
                onSalvarAvaliacao={handleSalvarAvaliacao}
                onFotoAdicionada={handleFotoAdicionada}
                onRegistrarPagamento={handleRegistrarPagamento}
                onEditarOs={handleEditarOs}
                onExcluir={handleExcluir}
              />
            }
          />
        ))}
      </div>
    </div>
  );
}
