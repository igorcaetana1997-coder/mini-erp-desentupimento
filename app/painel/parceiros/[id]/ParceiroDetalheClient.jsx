"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, IdCard, StickyNote } from "lucide-react";
import Ticket from "@/components/Ticket";
import EmptyState from "@/components/EmptyState";

export default function ParceiroDetalheClient({ parceiroId }) {
  const [parceiro, setParceiro] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/parceiros/${parceiroId}`);
        if (!res.ok) throw new Error();
        setParceiro(await res.json());
      } catch {
        setError("Não foi possível carregar o parceiro.");
      } finally {
        setLoaded(true);
      }
    })();
  }, [parceiroId]);

  if (!loaded) {
    return <div className="max-w-3xl mx-auto p-6 text-[rgb(var(--ink))] text-sm">Carregando…</div>;
  }

  if (error || !parceiro) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        <EmptyState text={error || "Parceiro não encontrado."} />
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
        <h1 className="font-black uppercase text-xl text-[rgb(var(--ink-strong)/1)] tracking-tight">{parceiro.name}</h1>
        <div className="flex flex-col gap-1 mt-2 text-sm text-[rgb(var(--ink))]">
          {parceiro.phone && (
            <span className="flex items-center gap-1.5">
              <Phone size={13} className="text-[#1E7A52]" /> {parceiro.phone}
            </span>
          )}
          {parceiro.email && (
            <span className="flex items-center gap-1.5">
              <Mail size={13} className="text-[#1E7A52]" /> {parceiro.email}
            </span>
          )}
          {parceiro.documento && (
            <span className="flex items-center gap-1.5">
              <IdCard size={13} className="text-[#1E7A52]" /> {parceiro.documento}
            </span>
          )}
        </div>
        {parceiro.observacoes && (
          <div className="mt-3 flex items-start gap-1.5 text-xs text-[rgb(var(--ink-strong)/1)] bg-[#E8A33D]/15 border border-[#E8A33D]/40 px-2 py-2">
            <StickyNote size={14} className="text-[#E8A33D] shrink-0 mt-0.5" />
            <span>{parceiro.observacoes}</span>
          </div>
        )}
      </div>

      <h2 className="font-black uppercase tracking-tight text-[rgb(var(--ink-strong)/1)] mb-3">
        Histórico de OS <span className="text-[rgb(var(--stone))] font-normal">({parceiro.ordens.length})</span>
      </h2>

      <div className="flex flex-col gap-3">
        {parceiro.ordens.length === 0 && <EmptyState text="Nenhuma OS registrada com este parceiro ainda." />}
        {parceiro.ordens.map((os) => (
          <Ticket key={os.id} os={os} />
        ))}
      </div>
    </div>
  );
}
