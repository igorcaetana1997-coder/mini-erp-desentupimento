"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Handshake, Trash2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";

export default function ParceirosClient() {
  const [parceiros, setParceiros] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/parceiros");
        if (!res.ok) throw new Error();
        setParceiros(await res.json());
      } catch {
        setError("Não foi possível carregar os parceiros.");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const addParceiro = async (data) => {
    setSaving(true);
    try {
      const res = await fetch("/api/parceiros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar parceiro");
      setParceiros((prev) => [json, ...prev]);
      setShowForm(false);
    } catch (e) {
      setError(e.message || "Não foi possível salvar o parceiro.");
    } finally {
      setSaving(false);
    }
  };

  const handleExcluir = async (id) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/parceiros/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível excluir o parceiro.");
      setParceiros((prev) => prev.filter((p) => p.id !== id));
      setConfirmId(null);
    } catch (e) {
      setError(e.message || "Não foi possível excluir o parceiro.");
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
          Parceiros <span className="text-[rgb(var(--stone))] font-normal">({parceiros.length})</span>
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 bg-[#1E7A52] text-[#F2EFE9] text-xs font-bold uppercase px-3 py-1.5 hover:bg-[#175F40] transition-colors"
        >
          <Handshake size={14} /> Novo
        </button>
      </div>

      {showForm && <ParceiroForm saving={saving} onSave={addParceiro} onCancel={() => setShowForm(false)} />}

      <div className="flex flex-col gap-2">
        {parceiros.length === 0 && !showForm && (
          <EmptyState text="Nenhum parceiro/terceirizado cadastrado ainda." />
        )}
        {parceiros.map((p) => (
          <div
            key={p.id}
            className="bg-[rgb(var(--input-bg)/0.60)] border border-[rgb(var(--border-strong)/0.2)] px-3 py-2 flex items-center justify-between gap-2 hover:bg-[rgb(var(--input-bg))] transition-colors"
          >
            <Link href={`/painel/parceiros/${p.id}`} className="min-w-0 flex-1">
              <p className="font-bold text-[rgb(var(--ink-strong)/1)] text-sm truncate">{p.name}</p>
              {p.phone && <p className="text-xs text-[rgb(var(--ink))]">{p.phone}</p>}
              {p.email && <p className="text-xs text-[rgb(var(--stone))] truncate">{p.email}</p>}
            </Link>
            {confirmId === p.id ? (
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
                  disabled={busyId === p.id}
                  onClick={() => handleExcluir(p.id)}
                  className="text-[11px] font-bold text-[#A02018] hover:underline disabled:opacity-50"
                >
                  Confirmar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmId(p.id)}
                className="shrink-0 text-[rgb(var(--stone))] hover:text-[#A02018] transition-colors p-1"
                title="Excluir parceiro"
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

function ParceiroForm({ onSave, onCancel, saving }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [documento, setDocumento] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      documento: documento.trim(),
      observacoes: observacoes.trim(),
    });
  };

  return (
    <div className="bg-[rgb(var(--input-bg))] border-2 border-[rgb(var(--border-strong)/1)] p-3 mb-3 flex flex-col gap-2">
      <p className="font-bold text-[rgb(var(--ink-strong)/1)] text-sm uppercase">Novo parceiro</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do parceiro/empresa terceirizada"
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Telefone (opcional)"
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-mail (opcional)"
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
      />
      <input
        value={documento}
        onChange={(e) => setDocumento(e.target.value)}
        placeholder="CPF/CNPJ (opcional)"
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
      />
      <textarea
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        placeholder="Observações (opcional)"
        rows={2}
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] resize-none"
      />
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
          {saving ? "Salvando…" : "Salvar parceiro"}
        </button>
      </div>
    </div>
  );
}
