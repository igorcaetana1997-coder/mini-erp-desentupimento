"use client";

import { useState } from "react";
import { X, FileText } from "lucide-react";
import ClientForm from "./ClientForm";

const SERVICE_TYPES = [
  "Desentupimento de vaso sanitário",
  "Desentupimento de pia",
  "Desentupimento de ralo",
  "Limpeza de caixa de gordura",
  "Desobstrução de rede de esgoto",
  "Outro serviço",
];

const OUTRO_SERVICO = "Outro serviço";
const OUTRO_PREFIXO = "Outro serviço: ";
const NOVO_CLIENTE = "__novo__";

export default function OrcamentoForm({ clients, initial, onSave, onCancel, onClienteCriado, saving }) {
  const ehOutro = initial?.serviceType?.startsWith(OUTRO_PREFIXO);
  const [clientId, setClientId] = useState(initial?.clienteId || clients[0]?.id || NOVO_CLIENTE);
  const [savingNovoCliente, setSavingNovoCliente] = useState(false);
  const [erroNovoCliente, setErroNovoCliente] = useState("");
  const [serviceType, setServiceType] = useState(ehOutro ? OUTRO_SERVICO : initial?.serviceType || SERVICE_TYPES[0]);
  const [outroTexto, setOutroTexto] = useState(ehOutro ? initial.serviceType.slice(OUTRO_PREFIXO.length) : "");
  const [value, setValue] = useState(initial?.value != null ? String(initial.value) : "");
  const [validoAte, setValidoAte] = useState(initial?.validoAte ? initial.validoAte.slice(0, 10) : "");
  const [observacoes, setObservacoes] = useState(initial?.observacoes || "");

  const criarClienteInline = async (data) => {
    setSavingNovoCliente(true);
    setErroNovoCliente("");
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível salvar o cliente.");
      onClienteCriado?.(json);
      setClientId(json.id);
    } catch (e) {
      setErroNovoCliente(e.message || "Não foi possível salvar o cliente.");
    } finally {
      setSavingNovoCliente(false);
    }
  };

  const submit = () => {
    if (!clientId || clientId === NOVO_CLIENTE || !value) return;
    const finalServiceType =
      serviceType === OUTRO_SERVICO && outroTexto.trim()
        ? `${OUTRO_PREFIXO}${outroTexto.trim()}`
        : serviceType;
    onSave({
      clienteId: clientId,
      serviceType: finalServiceType,
      value,
      validoAte: validoAte || null,
      observacoes,
    });
  };

  return (
    <div className="bg-[rgb(var(--input-bg))] border-2 border-[rgb(var(--border-strong)/1)] p-3 mb-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="font-bold text-[rgb(var(--ink-strong)/1)] text-sm uppercase">
          {initial ? "Editar orçamento" : "Novo orçamento"}
        </p>
        <button onClick={onCancel} type="button">
          <X size={16} className="text-[rgb(var(--stone))]" />
        </button>
      </div>

      <select
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        disabled={!!initial}
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] disabled:opacity-60"
      >
        {!initial && <option value={NOVO_CLIENTE}>+ Novo cliente</option>}
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {clientId === NOVO_CLIENTE ? (
        <>
          {erroNovoCliente && (
            <p className="text-xs font-semibold text-[#A02018] border border-[#A02018]/40 bg-[#A02018]/10 px-2 py-1.5">
              {erroNovoCliente}
            </p>
          )}
          <ClientForm
            saving={savingNovoCliente}
            onSave={criarClienteInline}
            onCancel={() => setClientId(clients[0]?.id || NOVO_CLIENTE)}
          />
        </>
      ) : (
        <>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
          >
            {SERVICE_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {serviceType === OUTRO_SERVICO && (
            <input
              value={outroTexto}
              onChange={(e) => setOutroTexto(e.target.value)}
              placeholder="Especifique o serviço (ex: limpeza de coluna)"
              className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
            />
          )}

          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Valor (R$)"
            className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
          />

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-[rgb(var(--ink))]">
              Válido até (opcional)
            </label>
            <input
              type="date"
              value={validoAte}
              onChange={(e) => setValidoAte(e.target.value)}
              className="w-full mt-1 border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
            />
          </div>

          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Observações (opcional)"
            rows={2}
            className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] resize-none"
          />

          <button
            onClick={submit}
            disabled={saving}
            type="button"
            className="bg-[#E8A33D] text-[#1a1208] text-xs font-bold uppercase py-2 hover:bg-[#d99527] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <FileText size={14} /> {saving ? "Salvando…" : initial ? "Salvar alterações" : "Salvar orçamento"}
          </button>
        </>
      )}
    </div>
  );
}
