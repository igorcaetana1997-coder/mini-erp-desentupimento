"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Printer, MessageCircle, Pencil, Check, X as XIcon, Trash2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import OrcamentoForm from "@/components/OrcamentoForm";
import { formatEndereco } from "@/lib/formatEndereco";

const STATUS_STAMP = {
  pendente: { label: "Pendente", bg: "#E8A33D", text: "#1a1208" },
  aprovado: { label: "Aprovado", bg: "#1E7A52", text: "#F2EFE9" },
  recusado: { label: "Recusado", bg: "#A02018", text: "#F2EFE9" },
};

export default function OrcamentoDetalheClient({ orcamentoId }) {
  const [orcamento, setOrcamento] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [editando, setEditando] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmAcao, setConfirmAcao] = useState(null); // "aprovar" | "recusar" | "excluir"

  const load = async () => {
    try {
      const res = await fetch(`/api/orcamentos/${orcamentoId}`);
      if (!res.ok) throw new Error();
      setOrcamento(await res.json());
    } catch {
      setError("Não foi possível carregar o orçamento.");
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    load();
  }, [orcamentoId]);

  const salvarEdicao = async (data) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/orcamentos/${orcamentoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível salvar as alterações.");
      setOrcamento(json);
      setEditando(false);
    } catch (e) {
      setError(e.message || "Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  };

  const mudarStatus = async (status) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/orcamentos/${orcamentoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível atualizar o orçamento.");
      setOrcamento(json);
      setConfirmAcao(null);
    } catch (e) {
      setError(e.message || "Não foi possível atualizar o orçamento.");
    } finally {
      setSaving(false);
    }
  };

  const excluir = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/orcamentos/${orcamentoId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível excluir o orçamento.");
      window.location.href = "/painel/orcamentos";
    } catch (e) {
      setError(e.message || "Não foi possível excluir o orçamento.");
      setSaving(false);
    }
  };

  if (!loaded) {
    return <div className="max-w-xl mx-auto p-6 text-[rgb(var(--ink))] text-sm">Carregando…</div>;
  }

  if (error && !orcamento) {
    return (
      <div className="max-w-xl mx-auto p-4 md:p-8">
        <EmptyState text={error} />
      </div>
    );
  }

  const stamp = STATUS_STAMP[orcamento.status];
  const digits = (orcamento.cliente?.phone || "").replace(/\D/g, "");
  const whatsappHref = digits
    ? `https://wa.me/55${digits}?text=${encodeURIComponent(
        `Olá! Segue o orçamento para ${orcamento.serviceType}, no valor de R$ ${Number(orcamento.value).toFixed(
          2
        )}. Baixe o PDF que geramos e anexe aqui, por favor.`
      )}`
    : null;

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8 print:p-0">
      <div className="print:hidden">
        <Link
          href="/painel/orcamentos"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-[rgb(var(--ink-strong)/1)] mb-4 hover:underline"
        >
          <ArrowLeft size={14} /> Voltar aos orçamentos
        </Link>

        {error && (
          <div className="mb-4 border border-[#A02018]/40 bg-[#A02018]/10 text-[#A02018] text-sm px-3 py-2 flex items-center justify-between">
            {error}
            <button onClick={() => setError("")} className="font-bold ml-3">
              ×
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-[#142D65] text-[#F2EFE9] text-xs font-bold uppercase tracking-wide px-3 py-2 hover:bg-[#203D7B] transition-colors"
          >
            <Printer size={14} /> Imprimir / salvar PDF
          </button>
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#1E7A52] text-[#F2EFE9] text-xs font-bold uppercase tracking-wide px-3 py-2 hover:bg-[#175F40] transition-colors"
            >
              <MessageCircle size={14} /> Abrir WhatsApp do cliente
            </a>
          )}
          {orcamento.status === "pendente" && (
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="flex items-center gap-1.5 border border-[rgb(var(--border-strong)/0.3)] text-[rgb(var(--ink-strong)/1)] text-xs font-bold uppercase tracking-wide px-3 py-2 hover:bg-[#142D65]/5 transition-colors"
            >
              <Pencil size={14} /> Editar
            </button>
          )}
        </div>

        {orcamento.status === "pendente" && (
          <div className="mb-4">
            {confirmAcao ? (
              <div className="flex items-center justify-between gap-2 bg-[rgb(var(--input-bg))] border border-[rgb(var(--border-strong)/0.2)] px-3 py-2">
                <span className="text-xs text-[rgb(var(--ink-strong)/1)]">
                  {confirmAcao === "aprovar" && "Marcar como aprovado e criar a ordem de serviço?"}
                  {confirmAcao === "recusar" && "Marcar este orçamento como recusado?"}
                  {confirmAcao === "excluir" && "Excluir este orçamento definitivamente?"}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setConfirmAcao(null)}
                    className="text-[11px] text-[rgb(var(--ink))] hover:text-[rgb(var(--ink-strong)/1)] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      confirmAcao === "excluir" ? excluir() : mudarStatus(confirmAcao === "aprovar" ? "aprovado" : "recusado")
                    }
                    className="text-[11px] font-bold text-[#A02018] hover:underline disabled:opacity-50"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmAcao("aprovar")}
                  className="flex items-center gap-1.5 bg-[#1E7A52] text-[#F2EFE9] text-xs font-bold uppercase tracking-wide px-3 py-2 hover:bg-[#175F40] transition-colors"
                >
                  <Check size={14} /> Marcar como aprovado
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmAcao("recusar")}
                  className="flex items-center gap-1.5 border border-[#A02018]/40 text-[#A02018] text-xs font-bold uppercase tracking-wide px-3 py-2 hover:bg-[#A02018]/10 transition-colors"
                >
                  <XIcon size={14} /> Marcar como recusado
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmAcao("excluir")}
                  className="flex items-center gap-1.5 text-[rgb(var(--stone))] text-xs font-bold uppercase tracking-wide px-3 py-2 hover:text-[#A02018] transition-colors"
                >
                  <Trash2 size={14} /> Excluir
                </button>
              </div>
            )}
          </div>
        )}

        {orcamento.status === "aprovado" && orcamento.ordemServico?.id && (
          <p className="text-xs text-[rgb(var(--ink))] mb-4">
            Aprovado — OS #{orcamento.ordemServico.id.slice(-6).toUpperCase()} criada.{" "}
            <Link href="/painel/ordens" className="font-bold underline text-[rgb(var(--ink-strong)/1)]">
              Ver ordens de serviço →
            </Link>
          </p>
        )}

        {editando && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="w-full max-w-md my-4">
              <OrcamentoForm
                clients={[orcamento.cliente]}
                initial={orcamento}
                saving={saving}
                onSave={salvarEdicao}
                onCancel={() => setEditando(false)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-[rgb(var(--surface))] border-2 border-[rgb(var(--border-strong)/1)] p-6 print:border-0 print:shadow-none">
        <div className="flex items-center justify-between border-b-2 border-dashed border-[rgb(var(--border-strong)/0.3)] pb-3 mb-4">
          <div>
            <Image
              src="/logo-horizontal-outline.png"
              alt="Real Leader Desentupidora"
              width={1800}
              height={603}
              className="h-10 w-auto mb-1"
            />
            <p className="text-xs text-[rgb(var(--stone))]">Orçamento</p>
          </div>
          <span
            className="inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-widest -rotate-2 border-2"
            style={{ background: stamp.bg, color: stamp.text, borderColor: stamp.text + "33" }}
          >
            {stamp.label}
          </span>
        </div>

        <p className="font-mono text-xs text-[rgb(var(--stone))] mb-1">
          Orçamento #{orcamento.id.slice(-6).toUpperCase()}
        </p>
        <p className="font-black uppercase text-[rgb(var(--ink-strong)/1)] text-xl mb-4">{orcamento.serviceType}</p>

        <div className="grid sm:grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase text-[rgb(var(--stone))]">Cliente</p>
            <p className="text-[rgb(var(--ink-strong)/1)] font-semibold">{orcamento.cliente?.name}</p>
            <p className="text-[rgb(var(--ink))]">{formatEndereco(orcamento.cliente)}</p>
            <p className="text-[rgb(var(--ink))]">{orcamento.cliente?.phone}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-[rgb(var(--stone))]">Valor</p>
            <p className="font-mono font-bold text-[rgb(var(--ink-strong)/1)] text-lg">
              R$ {Number(orcamento.value).toFixed(2)}
            </p>
            {orcamento.validoAte && (
              <p className="text-[rgb(var(--ink))]">
                Válido até {new Date(orcamento.validoAte).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
              </p>
            )}
          </div>
        </div>

        {orcamento.observacoes && (
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase text-[rgb(var(--stone))]">Observações</p>
            <p className="text-sm text-[rgb(var(--ink-strong)/1)]">{orcamento.observacoes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
