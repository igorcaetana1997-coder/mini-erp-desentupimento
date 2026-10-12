"use client";

import { useState } from "react";
import { X, Mail, Paperclip } from "lucide-react";

const LIMITE_POR_ARQUIVO = 3 * 1024 * 1024;

function CampoArquivo({ rotulo, dica, arquivo, onChange }) {
  return (
    <label className="flex flex-col gap-1 cursor-pointer">
      <span className="text-[11px] font-bold uppercase tracking-wide text-[rgb(var(--ink))]">{rotulo}</span>
      <span className="flex items-center gap-2 border border-dashed border-[rgb(var(--border-strong)/0.4)] px-2 py-2 text-sm text-[rgb(var(--ink-strong)/1)] hover:bg-[#142D65]/5 transition-colors">
        <Paperclip size={14} className="text-[rgb(var(--stone))] shrink-0" />
        <span className="truncate">{arquivo ? arquivo.name : dica}</span>
      </span>
      <input
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="hidden"
      />
    </label>
  );
}

export default function EnviarCobrancaModal({ os, onClose, onEnviado }) {
  const [nfe, setNfe] = useState(null);
  const [boleto, setBoleto] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [cc, setCc] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const destinatario = os.cliente?.email;

  const submit = async () => {
    setError("");
    if (!nfe && !boleto) {
      setError("Anexe pelo menos a NF-e ou o boleto.");
      return;
    }
    for (const arquivo of [nfe, boleto]) {
      if (arquivo && arquivo.size > LIMITE_POR_ARQUIVO) {
        setError(`${arquivo.name} tem mais de 3 MB.`);
        return;
      }
    }
    setEnviando(true);
    try {
      const form = new FormData();
      if (nfe) form.append("nfe", nfe);
      if (boleto) form.append("boleto", boleto);
      form.append("mensagem", mensagem);
      form.append("cc", cc);
      const res = await fetch(`/api/ordens/${os.id}/cobranca`, { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível enviar o e-mail.");
      onEnviado?.(json.cobrancaEnviadaEm);
    } catch (e) {
      setError(e.message || "Não foi possível enviar o e-mail.");
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[rgb(var(--surface))] border-2 border-[rgb(var(--border-strong)/1)] w-full max-w-md p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="font-black uppercase text-[rgb(var(--ink-strong)/1)]">
            NF-e + boleto · OS #{os.id.slice(-6).toUpperCase()}
          </p>
          <button onClick={onClose} type="button" disabled={enviando}>
            <X size={18} className="text-[rgb(var(--stone))]" />
          </button>
        </div>

        <p className="text-xs text-[rgb(var(--ink))]">
          Vai para <b className="text-[rgb(var(--ink-strong)/1)]">{destinatario}</b>, enviado de{" "}
          <b className="text-[rgb(var(--ink-strong)/1)]">comercial@realleaderdesentupidora.com.br</b>, com um texto
          amigável, o resumo do serviço e os arquivos em anexo.
        </p>

        <CampoArquivo rotulo="NF-e de serviço" dica="Escolher o PDF da nota" arquivo={nfe} onChange={setNfe} />
        <CampoArquivo rotulo="Boleto" dica="Escolher o PDF do boleto" arquivo={boleto} onChange={setBoleto} />

        <textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Mensagem extra (opcional) — ex: condição combinada, observação sobre o vencimento"
          rows={2}
          className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] resize-none"
        />

        <input
          value={cc}
          onChange={(e) => setCc(e.target.value)}
          placeholder="E-mails em cópia (CC) — separados por vírgula (opcional)"
          className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
        />

        {error && <p className="text-xs text-[#A02018] font-semibold">{error}</p>}

        <button
          onClick={submit}
          disabled={enviando}
          type="button"
          className="flex items-center justify-center gap-1.5 bg-[#1E7A52] text-[#F2EFE9] text-xs font-bold uppercase tracking-wide py-2.5 hover:bg-[#175F40] transition-colors disabled:opacity-50"
        >
          <Mail size={14} /> {enviando ? "Enviando…" : "Enviar por e-mail"}
        </button>
      </div>
    </div>
  );
}
