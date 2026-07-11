"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, IdCard, StickyNote, KeyRound } from "lucide-react";
import Ticket from "@/components/Ticket";
import EmptyState from "@/components/EmptyState";

export default function ParceiroDetalheClient({ parceiroId }) {
  const [parceiro, setParceiro] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [showAcessoForm, setShowAcessoForm] = useState(false);
  const [emailAcesso, setEmailAcesso] = useState("");
  const [senhaAcesso, setSenhaAcesso] = useState("");
  const [savingAcesso, setSavingAcesso] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`/api/parceiros/${parceiroId}`);
      if (!res.ok) throw new Error();
      setParceiro(await res.json());
    } catch {
      setError("Não foi possível carregar o parceiro.");
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    load();
  }, [parceiroId]);

  const criarAcesso = async () => {
    if (!emailAcesso.trim() || senhaAcesso.length < 6) return;
    setSavingAcesso(true);
    try {
      const res = await fetch(`/api/parceiros/${parceiroId}/acesso`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailAcesso.trim(), password: senhaAcesso }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível criar o acesso.");
      setShowAcessoForm(false);
      setEmailAcesso("");
      setSenhaAcesso("");
      await load();
    } catch (e) {
      setError(e.message || "Não foi possível criar o acesso.");
    } finally {
      setSavingAcesso(false);
    }
  };

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

      {error && (
        <div className="mb-4 border border-[#A02018]/40 bg-[#A02018]/10 text-[#A02018] text-sm px-3 py-2 flex items-center justify-between">
          {error}
          <button onClick={() => setError("")} className="font-bold ml-3">
            ×
          </button>
        </div>
      )}

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

      <div className="bg-[rgb(var(--input-bg))] border border-[rgb(var(--border-strong)/0.2)] p-4 mb-6">
        <h2 className="font-black uppercase text-sm text-[rgb(var(--ink-strong)/1)] mb-2 flex items-center gap-1.5">
          <KeyRound size={14} /> Acesso ao sistema
        </h2>
        {parceiro.logins?.length > 0 ? (
          <p className="text-sm text-[rgb(var(--ink))]">
            Login ativo: <span className="font-semibold text-[rgb(var(--ink-strong)/1)]">{parceiro.logins[0].email}</span>
          </p>
        ) : !showAcessoForm ? (
          <button
            type="button"
            onClick={() => setShowAcessoForm(true)}
            className="flex items-center gap-1 bg-[#1E7A52] text-[#F2EFE9] text-xs font-bold uppercase px-3 py-1.5 hover:bg-[#175F40] transition-colors"
          >
            <KeyRound size={14} /> Criar acesso
          </button>
        ) : (
          <div className="flex flex-col gap-2 max-w-sm">
            <input
              type="email"
              value={emailAcesso}
              onChange={(e) => setEmailAcesso(e.target.value)}
              placeholder="E-mail de acesso"
              className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
            />
            <input
              type="password"
              value={senhaAcesso}
              onChange={(e) => setSenhaAcesso(e.target.value)}
              placeholder="Senha (mín. 6 caracteres)"
              className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAcessoForm(false)}
                className="flex-1 border border-[rgb(var(--border-strong)/0.3)] text-[rgb(var(--ink-strong)/1)] text-xs font-bold uppercase py-2 hover:bg-[#142D65]/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={criarAcesso}
                disabled={savingAcesso}
                className="flex-1 bg-[#1E7A52] text-[#F2EFE9] text-xs font-bold uppercase py-2 hover:bg-[#175F40] transition-colors disabled:opacity-50"
              >
                {savingAcesso ? "Salvando…" : "Salvar acesso"}
              </button>
            </div>
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
