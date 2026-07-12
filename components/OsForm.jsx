"use client";

import { useState } from "react";
import { X, Wrench } from "lucide-react";

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

const PAYMENT_METHODS = [
  { value: "", label: "Forma de pagamento (opcional)" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "Pix" },
  { value: "cartao", label: "Cartão" },
  { value: "boleto", label: "Boleto" },
];

function nowLocalInputValue() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const PARCERIA_TIPOS = [
  { value: "repassado", label: "Repassei a ele — eu recebo comissão" },
  { value: "recebido", label: "Recebi dele — eu pago comissão" },
];

export default function OsForm({ clients, tecnicos, parceiros = [], onSave, onCancel, saving }) {
  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0]);
  const [outroTexto, setOutroTexto] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [value, setValue] = useState("");
  const [scheduledAt, setScheduledAt] = useState(nowLocalInputValue);
  const [urgent, setUrgent] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [parceiroId, setParceiroId] = useState("");
  const [parceriaTipo, setParceriaTipo] = useState(PARCERIA_TIPOS[0].value);
  const [parceriaPercentual, setParceriaPercentual] = useState("");

  const submit = () => {
    if (!clientId || !scheduledAt) return;
    const finalServiceType =
      serviceType === OUTRO_SERVICO && outroTexto.trim()
        ? `${OUTRO_PREFIXO}${outroTexto.trim()}`
        : serviceType;
    onSave({
      clienteId: clientId,
      serviceType: finalServiceType,
      technicianId: technicianId || null,
      value,
      scheduledAt,
      urgent,
      paymentMethod: paymentMethod || null,
      dueDate: dueDate || null,
      parceiroId: parceiroId || null,
      parceriaTipo: parceiroId ? parceriaTipo : null,
      parceriaPercentual: parceiroId ? parceriaPercentual : null,
    });
  };

  return (
    <div className="bg-[rgb(var(--input-bg))] border-2 border-[rgb(var(--border-strong)/1)] p-3 mb-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="font-bold text-[rgb(var(--ink-strong)/1)] text-sm uppercase">Nova ordem de serviço</p>
        <button onClick={onCancel} type="button">
          <X size={16} className="text-[rgb(var(--stone))]" />
        </button>
      </div>

      <select
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
      >
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

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

      <select
        value={technicianId}
        onChange={(e) => setTechnicianId(e.target.value)}
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
      >
        <option value="">Sem técnico designado</option>
        {tecnicos.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      <div>
        <label className="text-[11px] font-bold uppercase tracking-wide text-[rgb(var(--ink))]">
          Data e horário agendado da visita
        </label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="w-full mt-1 border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
        />
      </div>

      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Valor (R$)"
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
      />

      <div className="flex gap-2">
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] flex-1"
        >
          {PAYMENT_METHODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wide text-[rgb(var(--ink))]">
          Vencimento do pagamento (opcional)
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full mt-1 border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
        />
      </div>

      {parceiros.length > 0 && (
        <div className="border border-dashed border-[rgb(var(--border-strong)/0.3)] p-2 flex flex-col gap-2">
          <label className="text-[11px] font-bold uppercase tracking-wide text-[rgb(var(--ink))]">
            Serviço terceirizado? (opcional)
          </label>
          <select
            value={parceiroId}
            onChange={(e) => setParceiroId(e.target.value)}
            className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
          >
            <option value="">Não é terceirizado</option>
            {parceiros.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {parceiroId && (
            <>
              <select
                value={parceriaTipo}
                onChange={(e) => setParceriaTipo(e.target.value)}
                className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
              >
                {PARCERIA_TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={parceriaPercentual}
                onChange={(e) => setParceriaPercentual(e.target.value)}
                placeholder="Percentual da comissão (%)"
                className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
              />
            </>
          )}
        </div>
      )}

      <label className="flex items-center gap-2 text-xs text-[rgb(var(--ink))]">
        <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
        Chamado urgente
      </label>

      <button
        onClick={submit}
        disabled={saving}
        type="button"
        className="bg-[#E8A33D] text-[#1a1208] text-xs font-bold uppercase py-2 hover:bg-[#d99527] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
      >
        <Wrench size={14} /> {saving ? "Abrindo…" : "Abrir OS"}
      </button>
    </div>
  );
}
