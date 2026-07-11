"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, StickyNote, Mail, IdCard, Cake } from "lucide-react";
import Ticket from "@/components/Ticket";
import EmptyState from "@/components/EmptyState";
import { formatEndereco } from "@/lib/formatEndereco";

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export default function ClienteDetalheClient({ clienteId }) {
  const [cliente, setCliente] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/clientes/${clienteId}`);
        if (!res.ok) throw new Error();
        setCliente(await res.json());
      } catch {
        setError("Não foi possível carregar o cliente.");
      } finally {
        setLoaded(true);
      }
    })();
  }, [clienteId]);

  if (!loaded) {
    return <div className="max-w-3xl mx-auto p-6 text-[rgb(var(--ink))] text-sm">Carregando…</div>;
  }

  if (error || !cliente) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        <EmptyState text={error || "Cliente não encontrado."} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <Link
        href="/painel"
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-[rgb(var(--ink-strong)/1)] mb-4 hover:underline"
      >
        <ArrowLeft size={14} /> Voltar ao painel
      </Link>

      <div className="bg-[rgb(var(--input-bg))] border-2 border-[rgb(var(--border-strong)/1)] p-4 mb-6">
        <h1 className="font-black uppercase text-xl text-[rgb(var(--ink-strong)/1)] tracking-tight">{cliente.name}</h1>
        <div className="flex flex-col gap-1 mt-2 text-sm text-[rgb(var(--ink))]">
          {cliente.phone && (
            <span className="flex items-center gap-1.5">
              <Phone size={13} className="text-[#1E7A52]" /> {cliente.phone}
            </span>
          )}
          {cliente.email && (
            <span className="flex items-center gap-1.5">
              <Mail size={13} className="text-[#1E7A52]" /> {cliente.email}
            </span>
          )}
          {cliente.documento && (
            <span className="flex items-center gap-1.5">
              <IdCard size={13} className="text-[#1E7A52]" /> {cliente.documento}
            </span>
          )}
          {cliente.dataNascimento && (
            <span className="flex items-center gap-1.5">
              <Cake size={13} className="text-[#1E7A52]" /> {formatDate(cliente.dataNascimento)}
            </span>
          )}
          {formatEndereco(cliente) && (
            <span className="flex items-center gap-1.5">
              <MapPin size={13} className="text-[#1E7A52]" />
              {formatEndereco(cliente)} {cliente.cep && `— CEP ${cliente.cep}`}
            </span>
          )}
        </div>
        {cliente.observacoes && (
          <div className="mt-3 flex items-start gap-1.5 text-xs text-[rgb(var(--ink-strong)/1)] bg-[#E8A33D]/15 border border-[#E8A33D]/40 px-2 py-2">
            <StickyNote size={14} className="text-[#E8A33D] shrink-0 mt-0.5" />
            <span>{cliente.observacoes}</span>
          </div>
        )}
      </div>

      <h2 className="font-black uppercase tracking-tight text-[rgb(var(--ink-strong)/1)] mb-3">
        Histórico de OS <span className="text-[rgb(var(--stone))] font-normal">({cliente.ordens.length})</span>
      </h2>

      <div className="flex flex-col gap-3">
        {cliente.ordens.length === 0 && <EmptyState text="Nenhuma OS registrada para este cliente ainda." />}
        {cliente.ordens.map((os) => (
          <Ticket key={os.id} os={{ ...os, cliente }} />
        ))}
      </div>
    </div>
  );
}
