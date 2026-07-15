"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Printer, MessageCircle, Pencil, Check, X as XIcon, Trash2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import OrcamentoForm from "@/components/OrcamentoForm";
import DocumentoCard from "@/components/DocumentoCard";
import { formatEndereco } from "@/lib/formatEndereco";
import { formatMoeda } from "@/lib/formatMoeda";
import { baixarPdf, imprimirPdf } from "@/lib/gerarPdf";

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
  const [gerando, setGerando] = useState(null); // "baixar" | "imprimir" | null

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

  const montarDocumentoPdf = async () => {
    const emitidoEmLabel = new Date(orcamento.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const numero = `Nº ${orcamento.id.slice(-6).toUpperCase()} · Emitido em ${emitidoEmLabel}${
      orcamento.validoAte
        ? ` · Válido até ${new Date(orcamento.validoAte).toLocaleDateString("pt-BR", { timeZone: "UTC" })}`
        : ""
    }`;
    const { default: OrcamentoPdfDocument } = await import("@/lib/pdf/OrcamentoPdfDocument");
    return (
      <OrcamentoPdfDocument
        orcamento={orcamento}
        stamp={STATUS_STAMP[orcamento.status]}
        emitidoEmLabel={emitidoEmLabel}
        numero={numero}
      />
    );
  };

  const handleBaixar = async () => {
    if (!orcamento) return;
    setError("");
    setGerando("baixar");
    try {
      const documento = await montarDocumentoPdf();
      await baixarPdf(documento, `orcamento-${orcamento.id.slice(-6).toUpperCase()}.pdf`);
    } catch {
      setError("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setGerando(null);
    }
  };

  const handleImprimir = async () => {
    if (!orcamento) return;
    setError("");
    setGerando("imprimir");
    try {
      const documento = await montarDocumentoPdf();
      await imprimirPdf(documento);
    } catch {
      setError("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setGerando(null);
    }
  };

  if (!loaded) {
    return <div className="max-w-4xl mx-auto p-6 text-[rgb(var(--ink))] text-sm">Carregando…</div>;
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
        `Olá! Segue o orçamento para ${orcamento.serviceType}, no valor de R$ ${formatMoeda(
          orcamento.value
        )}. Baixe o PDF que geramos e anexe aqui, por favor.`
      )}`
    : null;
  const emitidoEmLabel = new Date(orcamento.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
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
          onClick={handleBaixar}
          disabled={gerando !== null}
          className="flex items-center gap-1.5 bg-[#1E7A52] text-[#F2EFE9] text-xs font-bold uppercase tracking-wide px-3 py-2 hover:bg-[#175F40] transition-colors disabled:opacity-60"
        >
          <Download size={14} /> {gerando === "baixar" ? "Gerando PDF…" : "Baixar PDF"}
        </button>
        <button
          type="button"
          onClick={handleImprimir}
          disabled={gerando !== null}
          className="flex items-center gap-1.5 border border-[rgb(var(--border-strong)/0.3)] text-[rgb(var(--ink-strong)/1)] text-xs font-bold uppercase tracking-wide px-3 py-2 hover:bg-[#142D65]/5 transition-colors disabled:opacity-60"
        >
          <Printer size={14} /> {gerando === "imprimir" ? "Gerando PDF…" : "Imprimir"}
        </button>
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-[#142D65] text-[#F2EFE9] text-xs font-bold uppercase tracking-wide px-3 py-2 hover:bg-[#203D7B] transition-colors"
          >
            <MessageCircle size={14} /> Abrir WhatsApp do cliente
          </a>
        )}
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="flex items-center gap-1.5 border border-[rgb(var(--border-strong)/0.3)] text-[rgb(var(--ink-strong)/1)] text-xs font-bold uppercase tracking-wide px-3 py-2 hover:bg-[#142D65]/5 transition-colors"
        >
          <Pencil size={14} /> Editar
        </button>
      </div>

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
            {orcamento.status === "pendente" && (
              <>
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
              </>
            )}
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

      <div className="overflow-x-auto">
        <DocumentoCard
          kicker="Orçamento de serviço"
          numero={`Nº ${orcamento.id.slice(-6).toUpperCase()} · Emitido em ${emitidoEmLabel}${
            orcamento.validoAte
              ? ` · Válido até ${new Date(orcamento.validoAte).toLocaleDateString("pt-BR", { timeZone: "UTC" })}`
              : ""
          }`}
          titulo={orcamento.serviceType}
          stampLabel={stamp.label}
          stampBg={stamp.bg}
          stampText={stamp.text}
          hash={`ORC-${orcamento.id.slice(-6).toUpperCase()}`}
          emitidoEm={emitidoEmLabel}
        >
          <div className="info-grid">
            <div>
              <p className="field-label">Cliente</p>
              <p className="field-value">{orcamento.cliente?.name}</p>
              <p className="field-sub">{formatEndereco(orcamento.cliente)}</p>
              <p className="field-sub">{orcamento.cliente?.phone}</p>
            </div>
            <div>
              <p className="field-label">Validade do orçamento</p>
              <p className="field-value">
                {orcamento.validoAte
                  ? new Date(orcamento.validoAte).toLocaleDateString("pt-BR", { timeZone: "UTC" })
                  : "Não informada"}
              </p>
              <p className="field-sub">Sujeito a confirmação após vistoria no local.</p>
            </div>
          </div>

          <table className="items">
            <thead>
              <tr>
                <th>Descrição</th>
                <th className="num">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {orcamento.serviceType}
                  {orcamento.observacoes && <span className="sub-line">{orcamento.observacoes}</span>}
                </td>
                <td className="num">R$ {formatMoeda(orcamento.value)}</td>
              </tr>
              <tr className="totals-row">
                <td className="label">Valor total do orçamento</td>
                <td className="num">R$ {formatMoeda(orcamento.value)}</td>
              </tr>
            </tbody>
          </table>

          <p className="disclaimer">
            Este orçamento não substitui nota fiscal e não constitui cobrança — os valores podem ser ajustados após
            vistoria técnica no local.
          </p>
        </DocumentoCard>
      </div>

      <style jsx>{`
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          padding: 18px 0;
          border-top: 1px solid rgba(20, 45, 101, 0.16);
        }
        .field-label {
          font-family: "Helvetica Neue", Arial, sans-serif;
          font-size: 9.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #948c7d;
          margin: 0 0 4px;
        }
        .field-value {
          font-size: 14px;
          color: #221d14;
          font-weight: 600;
          margin: 0 0 2px;
          line-height: 1.45;
        }
        .field-sub {
          font-size: 12.5px;
          color: #635b4c;
          margin: 0;
          line-height: 1.5;
        }
        :global(table.items) {
          width: 100%;
          border-collapse: collapse;
          margin-top: 6px;
        }
        :global(table.items thead th) {
          font-family: "Helvetica Neue", Arial, sans-serif;
          font-size: 9.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #f2efe9;
          background: #142d65;
          text-align: left;
          padding: 8px 12px;
        }
        :global(table.items thead th.num) {
          text-align: right;
        }
        :global(table.items tbody td) {
          font-size: 13px;
          color: #221d14;
          padding: 12px;
          border-bottom: 1px solid rgba(20, 45, 101, 0.14);
          vertical-align: top;
        }
        :global(table.items tbody td.num) {
          text-align: right;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
          font-weight: 600;
        }
        :global(table.items tbody .sub-line) {
          display: block;
          font-size: 11px;
          color: #948c7d;
          margin-top: 3px;
          font-style: italic;
        }
        :global(table.items .totals-row td) {
          border-bottom: none !important;
          border-top: 2px solid #142d65;
          padding-top: 12px !important;
        }
        :global(table.items .totals-row .label) {
          font-family: "Helvetica Neue", Arial, sans-serif;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #142d65;
        }
        :global(table.items .totals-row .num) {
          font-family: "Helvetica Neue", Arial, sans-serif;
          font-weight: 800;
          font-size: 19px;
          color: #142d65;
        }
        .disclaimer {
          font-size: 10.5px;
          color: #948c7d;
          font-style: italic;
          padding-top: 14px;
          line-height: 1.55;
        }
      `}</style>
    </div>
  );
}
