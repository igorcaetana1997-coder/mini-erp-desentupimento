"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, StickyNote, Mail, IdCard, Cake, Pencil } from "lucide-react";
import Ticket from "@/components/Ticket";
import EmptyState from "@/components/EmptyState";
import ClientForm from "@/components/ClientForm";
import { formatEndereco } from "@/lib/formatEndereco";

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export default function ClienteDetalheClient({ clienteId }) {
  const [cliente, setCliente] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [editando, setEditando] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorEdicao, setErrorEdicao] = useState("");

  const load = async () => {
    try {
      const res = await fetch(`/api/clientes/${clienteId}`);
      if (!res.ok) throw new Error();
      setCliente(await res.json());
    } catch {
      setError("Não foi possível carregar o cliente.");
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    load();
  }, [clienteId]);

  const salvarEdicao = async (data) => {
    setSaving(true);
    setErrorEdicao("");
    try {
      const res = await fetch(`/api/clientes/${clienteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível salvar as alterações.");
      setCliente((prev) => ({ ...prev, ...json }));
      setEditando(false);
    } catch (e) {
      setErrorEdicao(e.message || "Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  };

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
        <div className="flex items-start justify-between gap-2">
          <h1 className="font-black uppercase text-xl text-[rgb(var(--ink-strong)/1)] tracking-tight">{cliente.name}</h1>
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="flex items-center gap-1 text-[11px] font-bold uppercase text-[rgb(var(--ink-strong)/1)] hover:underline shrink-0"
          >
            <Pencil size={13} /> Editar
          </button>
        </div>
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
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatEndereco(cliente))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:underline hover:text-[#1E7A52] transition-colors"
            >
              <MapPin size={13} className="text-[#1E7A52]" />
              {formatEndereco(cliente)} {cliente.cep && `— CEP ${cliente.cep}`}
            </a>
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

      {editando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-md my-4">
            {errorEdicao && (
              <div className="mb-2 border border-[#A02018]/40 bg-[#A02018]/10 text-[#A02018] text-sm px-3 py-2">
                {errorEdicao}
              </div>
            )}
            <ClientForm
              initial={cliente}
              saving={saving}
              onSave={salvarEdicao}
              onCancel={() => setEditando(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
