"use client";

import { useState } from "react";
import { Download, Printer, MessageCircle } from "lucide-react";
import DocumentoCard from "@/components/DocumentoCard";
import { STATUS as OS_STATUS } from "@/components/Stamp";
import { formatEndereco } from "@/lib/formatEndereco";
import { formatMoeda } from "@/lib/formatMoeda";
import { baixarPdf, imprimirPdf } from "@/lib/gerarPdf";

const PAYMENT_LABELS = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao: "Cartão",
  boleto: "Boleto",
};

export default function ReciboDocumento({
  osId,
  serviceType,
  cliente,
  dataVisitaLabel,
  tecnicoNome,
  value,
  valorPago,
  paymentMethod,
  statusPagamento,
  status,
  materiais,
  avaliacaoNota,
  assinaturaCliente,
  emitidoEmLabel,
}) {
  const [gerando, setGerando] = useState(null); // "baixar" | "imprimir" | null
  const [erro, setErro] = useState("");

  const digits = (cliente?.phone || "").replace(/\D/g, "");
  const whatsappHref = digits
    ? `https://wa.me/55${digits}?text=${encodeURIComponent(
        "Olá! Segue o recibo do serviço realizado. Baixe o PDF que acabamos de gerar e anexe aqui, por favor."
      )}`
    : null;

  const osStamp = OS_STATUS[status] || OS_STATUS.aberta;

  const totalLabel =
    statusPagamento.status === "pago"
      ? `Total pago · ${PAYMENT_LABELS[paymentMethod] || "não informado"}`
      : statusPagamento.status === "parcial"
      ? `Pago parcialmente · falta R$ ${formatMoeda(statusPagamento.faltante)}`
      : "Valor total (pendente)";

  const montarDocumentoPdf = async () => {
    const { default: ReciboPdfDocument } = await import("@/lib/pdf/ReciboPdfDocument");
    return (
      <ReciboPdfDocument
        osId={osId}
        serviceType={serviceType}
        cliente={cliente}
        dataVisitaLabel={dataVisitaLabel}
        tecnicoNome={tecnicoNome}
        value={value}
        materiais={materiais}
        avaliacaoNota={avaliacaoNota}
        assinaturaCliente={assinaturaCliente}
        totalLabel={totalLabel}
        osStamp={osStamp}
        emitidoEmLabel={emitidoEmLabel}
      />
    );
  };

  const handleBaixar = async () => {
    setErro("");
    setGerando("baixar");
    try {
      const documento = await montarDocumentoPdf();
      await baixarPdf(documento, `recibo-os-${osId.slice(-6).toUpperCase()}.pdf`);
    } catch {
      setErro("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setGerando(null);
    }
  };

  const handleImprimir = async () => {
    setErro("");
    setGerando("imprimir");
    try {
      const documento = await montarDocumentoPdf();
      await imprimirPdf(documento);
    } catch {
      setErro("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setGerando(null);
    }
  };

  return (
    <div>
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
        {erro && <p className="text-xs text-[#A02018] w-full">{erro}</p>}
      </div>

      <div className="overflow-x-auto">
        <DocumentoCard
          kicker="Recibo de ordem de serviço"
          numero={`OS Nº ${osId.slice(-6).toUpperCase()} · Atendimento em ${dataVisitaLabel}`}
          titulo={serviceType}
          stampLabel={osStamp.label}
          stampBg={osStamp.bg}
          stampText={osStamp.text}
          hash={`REC-${osId.slice(-6).toUpperCase()}`}
          emitidoEm={emitidoEmLabel}
        >
          <div className="info-grid">
            <div>
              <p className="field-label">Cliente</p>
              <p className="field-value">{cliente?.name}</p>
              <p className="field-sub">{formatEndereco(cliente)}</p>
              <p className="field-sub">{cliente?.phone}</p>
            </div>
            <div>
              <p className="field-label">Atendimento</p>
              <p className="field-value">{dataVisitaLabel}</p>
              <p className="field-sub">Técnico responsável: {tecnicoNome || "—"}</p>
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
                  {serviceType}
                  {materiais && <span className="sub-line">Materiais: {materiais}</span>}
                </td>
                <td className="num">{value != null ? `R$ ${formatMoeda(value)}` : "—"}</td>
              </tr>
              <tr className="totals-row">
                <td className="label">{totalLabel}</td>
                <td className="num">{value != null ? `R$ ${formatMoeda(value)}` : "—"}</td>
              </tr>
            </tbody>
          </table>

          {avaliacaoNota && (
            <div className="note-block">
              <p className="field-label">Avaliação do cliente</p>
              <p>{avaliacaoNota} / 5</p>
            </div>
          )}

          <div className="signature-area">
            <p className="sig-caption">Assinatura do cliente</p>
            {assinaturaCliente ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={assinaturaCliente} alt="Assinatura do cliente" className="sig-img" />
            ) : null}
            <div className="sig-line" />
          </div>
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
        .note-block {
          padding: 16px 0 4px;
          font-size: 12px;
          color: #635b4c;
          line-height: 1.6;
        }
        .note-block p:last-child {
          margin: 0;
        }
        .signature-area {
          margin-top: auto;
          padding-top: 26px;
        }
        .sig-caption {
          font-family: "Helvetica Neue", Arial, sans-serif;
          font-size: 9.5px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #948c7d;
          margin: 0 0 6px;
        }
        .sig-line {
          border-top: 1px solid #948c7d;
          width: 62%;
          margin-top: 4px;
        }
        :global(.sig-img) {
          height: 68px;
          display: block;
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
}
