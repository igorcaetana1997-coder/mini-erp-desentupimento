"use client";

import { AlertTriangle, User, MapPin, Phone, StickyNote, Wrench, Star, Camera, Handshake } from "lucide-react";
import Stamp from "./Stamp";
import { formatEndereco } from "@/lib/formatEndereco";
import { getStatusPagamento } from "@/lib/paymentStatus";

const PAGAMENTO_LABELS = {
  pago: { texto: "Pago", classe: "text-[#1E7A52]" },
  parcial: { texto: "Pagamento parcial", classe: "text-[#E8A33D]" },
  pendente: { texto: "Pagamento pendente", classe: "text-[#A02018]" },
};

const PAYMENT_LABELS = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao: "Cartão",
  boleto: "Boleto",
};

function formatDateTime(value) {
  const d = new Date(value);
  const data = d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  const hora = d.toLocaleTimeString("pt-BR", { timeZone: "UTC", hour: "2-digit", minute: "2-digit" });
  return `${data} ${hora}`;
}

export default function Ticket({ os, compact, actions }) {
  const cliente = os.cliente;
  const endereco = formatEndereco(cliente);
  const { status: statusPagamento, faltante } = getStatusPagamento(os);

  return (
    <div className="relative bg-[rgb(var(--surface))] border-2 border-[rgb(var(--border-strong)/1)] shadow-[4px_4px_0_rgb(var(--border-strong))]">
      <div
        className="absolute -left-[7px] top-0 bottom-0 w-3.5"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0, transparent 5px, rgb(var(--surface)) 5.5px)",
          backgroundSize: "14px 14px",
          backgroundPosition: "-3.5px -7px",
        }}
      />
      <div className="pl-5 pr-4 py-3 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-[11px] text-[rgb(var(--stone))]">
              OS #{os.id.slice(-6).toUpperCase()}
            </p>
            <p className="font-black text-[rgb(var(--ink-strong)/1)] uppercase tracking-tight leading-tight">
              {os.serviceType}
            </p>
          </div>
          {os.urgent && (
            <span className="flex items-center gap-1 text-[#A02018] text-[10px] font-black uppercase shrink-0">
              <AlertTriangle size={12} /> Urgente
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-sm text-[rgb(var(--ink-strong)/1)]">
          <User size={14} className="text-[#1E7A52]" />
          {cliente?.name || "Cliente removido"}
        </div>
        {endereco && (
          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--ink))]">
            <MapPin size={12} className="text-[#1E7A52] shrink-0" />
            {endereco}
          </div>
        )}
        {cliente?.phone && !compact && (
          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--ink))]">
            <Phone size={12} className="text-[#1E7A52]" />
            {cliente.phone}
          </div>
        )}
        {cliente?.observacoes && (
          <div className="flex items-start gap-1.5 text-xs text-[rgb(var(--ink-strong)/1)] bg-[#E8A33D]/15 border border-[#E8A33D]/30 px-2 py-1.5">
            <StickyNote size={12} className="text-[#E8A33D] shrink-0 mt-0.5" />
            {cliente.observacoes}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-dashed border-[rgb(var(--border-strong)/0.3)] mt-1">
          <div className="flex items-center gap-2">
            <Stamp status={os.status} />
            <span className="font-mono text-xs text-[rgb(var(--stone))]">{formatDateTime(os.scheduledAt)}</span>
          </div>
          <span className="font-mono font-bold text-[rgb(var(--ink-strong)/1)]">
            {os.value ? `R$ ${Number(os.value).toFixed(2)}` : "—"}
          </span>
        </div>

        {(os.paymentMethod || statusPagamento) && (
          <div className="flex items-center gap-2 text-[11px] text-[rgb(var(--ink))]">
            {os.paymentMethod && (
              <span className="border border-[rgb(var(--border-strong)/0.2)] px-1.5 py-0.5">
                {PAYMENT_LABELS[os.paymentMethod] || os.paymentMethod}
              </span>
            )}
            {statusPagamento && (
              <span className={`px-1.5 py-0.5 font-semibold ${PAGAMENTO_LABELS[statusPagamento].classe}`}>
                {PAGAMENTO_LABELS[statusPagamento].texto}
              </span>
            )}
            {os.dueDate && (
              <span>vence {new Date(os.dueDate).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</span>
            )}
          </div>
        )}

        {faltante > 0 && (
          <p className="text-[11px] font-semibold text-[#A02018] flex items-center gap-1.5 bg-[#A02018]/10 border border-[#A02018]/30 px-2 py-1">
            <AlertTriangle size={12} className="shrink-0" /> Falta receber R$ {faltante.toFixed(2)}
          </p>
        )}

        {os.materiais && (
          <p className="text-[11px] text-[rgb(var(--ink-strong)/1)] flex items-start gap-1.5">
            <Wrench size={12} className="text-[#1E7A52] shrink-0 mt-0.5" />
            <span>
              <span className="text-[rgb(var(--stone))]">Materiais: </span>
              {os.materiais}
            </span>
          </p>
        )}

        {os.status === "recusada" && os.motivoRecusa && (
          <p className="text-[11px] text-[#A02018]">
            <span className="font-semibold">Motivo da recusa: </span>
            {os.motivoRecusa}
          </p>
        )}

        {Array.isArray(os.fotos) && os.fotos.length > 0 && (
          <p className="text-[11px] text-[rgb(var(--stone))] flex items-center gap-1">
            <Camera size={12} className="text-[#1E7A52]" /> {os.fotos.length} foto(s) anexada(s)
          </p>
        )}

        {os.avaliacaoNota && (
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={13}
                className={n <= os.avaliacaoNota ? "text-[#E8A33D] fill-[#E8A33D]" : "text-[rgb(var(--ink-strong)/0.2)]"}
              />
            ))}
          </div>
        )}

        {os.technician && (
          <p className="text-[11px] text-[rgb(var(--stone))]">
            Técnico: <span className="text-[rgb(var(--ink-strong)/1)] font-semibold">{os.technician.name}</span>
          </p>
        )}

        {os.parceiro && os.parceriaTipo && (
          <p className="text-[11px] text-[rgb(var(--stone))] flex items-center gap-1.5">
            <Handshake size={12} className="text-[#E8A33D] shrink-0" />
            {os.parceriaTipo === "repassado" ? (
              <span>
                Repassado a <span className="text-[rgb(var(--ink-strong)/1)] font-semibold">{os.parceiro.name}</span> —
                comissão {os.parceriaPercentual}%
                {os.value != null && ` (R$ ${(Number(os.value) * (os.parceriaPercentual / 100)).toFixed(2)})`}
              </span>
            ) : (
              <span>
                Recebido de <span className="text-[rgb(var(--ink-strong)/1)] font-semibold">{os.parceiro.name}</span> —
                repasse {os.parceriaPercentual}%
                {os.value != null && ` (R$ ${(Number(os.value) * (os.parceriaPercentual / 100)).toFixed(2)})`}
              </span>
            )}
          </p>
        )}

        {actions}
      </div>
    </div>
  );
}
