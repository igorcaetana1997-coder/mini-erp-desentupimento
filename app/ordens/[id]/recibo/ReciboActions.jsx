"use client";

import { Printer, MessageCircle } from "lucide-react";

export default function ReciboActions({ telefone }) {
  const digits = (telefone || "").replace(/\D/g, "");
  const whatsappHref = digits
    ? `https://wa.me/55${digits}?text=${encodeURIComponent(
        "Olá! Segue o recibo do serviço realizado. Baixe o PDF que acabamos de gerar e anexe aqui, por favor."
      )}`
    : null;

  return (
    <div className="print:hidden flex flex-wrap gap-2 mb-4">
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
      <p className="text-[11px] text-[rgb(var(--ink))] w-full">
        Dica: clique em "Imprimir / salvar PDF" e escolha "Salvar como PDF" na janela de impressão do navegador.
        Depois anexe o arquivo manualmente na conversa do WhatsApp que abrir.
      </p>
    </div>
  );
}
