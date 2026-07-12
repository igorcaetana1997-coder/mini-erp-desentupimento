"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";

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

const PARCERIA_TIPOS = [
  { value: "repassado", label: "Repassei a ele — eu recebo comissão" },
  { value: "recebido", label: "Recebi dele — eu pago comissão" },
];

function toLocalInputValue(value) {
  const d = new Date(value);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function EditarOsModal({ os, tecnicos, parceiros = [], onConfirm, onCancel, saving }) {
  const ehOutro = os.serviceType?.startsWith(OUTRO_PREFIXO);
  const [serviceType, setServiceType] = useState(ehOutro ? OUTRO_SERVICO : os.serviceType);
  const [outroTexto, setOutroTexto] = useState(ehOutro ? os.serviceType.slice(OUTRO_PREFIXO.length) : "");
  const [technicianId, setTechnicianId] = useState(os.technicianId || "");
  const [value, setValue] = useState(os.value != null ? String(os.value) : "");
  const [scheduledAt, setScheduledAt] = useState(toLocalInputValue(os.scheduledAt));
  const [urgent, setUrgent] = useState(!!os.urgent);
  const [paymentMethod, setPaymentMethod] = useState(os.paymentMethod || "");
  const [dueDate, setDueDate] = useState(os.dueDate ? os.dueDate.slice(0, 10) : "");
  const [parceiroId, setParceiroId] = useState(os.parceiroId || "");
  const [parceriaTipo, setParceriaTipo] = useState(os.parceriaTipo || PARCERIA_TIPOS[0].value);
  const [parceriaPercentual, setParceriaPercentual] = useState(
    os.parceriaPercentual != null ? String(os.parceriaPercentual) : ""
  );

  const submit = () => {
    const finalServiceType =
      serviceType === OUTRO_SERVICO && outroTexto.trim()
        ? `${OUTRO_PREFIXO}${outroTexto.trim()}`
        : serviceType;
    onConfirm({
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[rgb(var(--surface))] border-2 border-[rgb(var(--border-strong)/1)] w-full max-w-md p-4 flex flex-col gap-2 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <p className="font-black uppercase text-[rgb(var(--ink-strong)/1)]">Editar OS #{os.id.slice(-6).toUpperCase()}</p>
          <button onClick={onCancel} type="button">
            <X size={18} className="text-[rgb(var(--stone))]" />
          </button>
        </div>

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
          className="flex items-center justify-center gap-1.5 bg-[#142D65] text-[#F2EFE9] text-xs font-bold uppercase tracking-wide py-2.5 hover:bg-[#203D7B] transition-colors disabled:opacity-50"
        >
          <Save size={14} /> {saving ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}
