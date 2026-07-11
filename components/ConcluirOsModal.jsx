"use client";

import { useRef, useState } from "react";
import { X, Check, Star } from "lucide-react";
import SignaturePad from "./SignaturePad";

const PAYMENT_METHODS = [
  { value: "", label: "Forma de pagamento (opcional)" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "Pix" },
  { value: "cartao", label: "Cartão" },
  { value: "boleto", label: "Boleto" },
];

export default function ConcluirOsModal({ os, onConfirm, onCancel, saving }) {
  const signatureRef = useRef(null);
  const [materiais, setMateriais] = useState(os.materiais || "");
  const [paymentMethod, setPaymentMethod] = useState(os.paymentMethod || "");
  const [avaliacaoNota, setAvaliacaoNota] = useState(0);
  const [error, setError] = useState("");

  const submit = () => {
    if (signatureRef.current?.isEmpty()) {
      setError("Peça para o cliente assinar antes de concluir.");
      return;
    }
    onConfirm({
      assinaturaCliente: signatureRef.current.getDataUrl(),
      materiais: materiais.trim(),
      paymentMethod: paymentMethod || null,
      avaliacaoNota: avaliacaoNota || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[rgb(var(--surface))] border-2 border-[rgb(var(--border-strong)/1)] w-full max-w-md p-4 flex flex-col gap-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <p className="font-black uppercase text-[rgb(var(--ink-strong)/1)]">Concluir OS #{os.id.slice(-6).toUpperCase()}</p>
          <button onClick={onCancel} type="button">
            <X size={18} className="text-[rgb(var(--stone))]" />
          </button>
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-[rgb(var(--ink))]">
            Materiais/peças usados (opcional)
          </label>
          <textarea
            value={materiais}
            onChange={(e) => setMateriais(e.target.value)}
            rows={2}
            placeholder="Ex: mangueira de alta pressão, vedante, 2m de cano PVC"
            className="w-full mt-1 border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] resize-none"
          />
        </div>

        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
        >
          {PAYMENT_METHODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-[rgb(var(--ink))]">
            Avaliação do serviço (opcional)
          </label>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setAvaliacaoNota(n === avaliacaoNota ? 0 : n)}>
                <Star
                  size={22}
                  className={n <= avaliacaoNota ? "text-[#E8A33D] fill-[#E8A33D]" : "text-[rgb(var(--ink-strong)/0.25)]"}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-[rgb(var(--ink))]">
            Assinatura do cliente (obrigatória)
          </label>
          <div className="mt-1">
            <SignaturePad ref={signatureRef} />
          </div>
        </div>

        {error && <p className="text-xs text-[#A02018] font-semibold">{error}</p>}

        <button
          onClick={submit}
          disabled={saving}
          type="button"
          className="flex items-center justify-center gap-1.5 bg-[#142D65] text-[#F2EFE9] text-xs font-bold uppercase tracking-wide py-2.5 hover:bg-[#203D7B] transition-colors disabled:opacity-50"
        >
          <Check size={14} /> {saving ? "Concluindo…" : "Concluir OS"}
        </button>
      </div>
    </div>
  );
}
