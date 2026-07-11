"use client";

import { useState } from "react";
import { X, Ban } from "lucide-react";

export default function RecusarOsModal({ os, onConfirm, onCancel, saving }) {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!motivo.trim()) {
      setError("Informe o motivo da recusa.");
      return;
    }
    onConfirm(motivo.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[rgb(var(--surface))] border-2 border-[rgb(var(--border-strong)/1)] w-full max-w-sm p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="font-black uppercase text-[rgb(var(--ink-strong)/1)]">Recusar OS #{os.id.slice(-6).toUpperCase()}</p>
          <button onClick={onCancel} type="button">
            <X size={18} className="text-[rgb(var(--stone))]" />
          </button>
        </div>
        <textarea
          autoFocus
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={3}
          placeholder="Motivo da recusa (ex: fora da área de atendimento, sem acesso ao local)"
          className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] resize-none"
        />
        {error && <p className="text-xs text-[#A02018] font-semibold">{error}</p>}
        <button
          onClick={submit}
          disabled={saving}
          type="button"
          className="flex items-center justify-center gap-1.5 bg-[#A02018] text-[#F2EFE9] text-xs font-bold uppercase tracking-wide py-2.5 hover:bg-[#7A1812] transition-colors disabled:opacity-50"
        >
          <Ban size={14} /> {saving ? "Enviando…" : "Confirmar recusa"}
        </button>
      </div>
    </div>
  );
}
