"use client";

import { useState } from "react";
import { X, FileText, Plus, Trash2 } from "lucide-react";
import ClientForm from "./ClientForm";
import { formatMoeda } from "@/lib/formatMoeda";
import { montarMensagemDescontoAvista } from "@/lib/orcamentoDesconto";

const SERVICE_TYPES = [
  "Desentupimento de vaso sanitário",
  "Desentupimento de pia",
  "Desentupimento de ralo",
  "Limpeza de caixa de gordura",
  "Desobstrução de rede de esgoto",
  "Outro serviço",
];

const OUTRO_SERVICO = "Outro serviço";
const NOVO_CLIENTE = "__novo__";

function novoItem() {
  return { tipo: SERVICE_TYPES[0], outroTexto: "", quantidade: "1", valorUnitario: "" };
}

// Monta a lista inicial de itens a partir do orçamento sendo editado.
// Orçamentos com itens (criados após esta feature) usam `initial.itens` direto.
// Orçamentos legados (sem itens) pré-populam 1 linha a partir do resumo antigo
// (serviceType/value) — se o admin salvar, esse orçamento passa a ter itens.
function itensIniciais(initial) {
  if (initial?.itens?.length) {
    return initial.itens.map((it) => {
      const ehOutro = !SERVICE_TYPES.includes(it.descricao);
      return {
        tipo: ehOutro ? OUTRO_SERVICO : it.descricao,
        outroTexto: ehOutro ? it.descricao : "",
        quantidade: String(it.quantidade),
        valorUnitario: String(it.valorUnitario),
      };
    });
  }
  if (initial?.serviceType) {
    const ehOutro = !SERVICE_TYPES.includes(initial.serviceType);
    return [
      {
        tipo: ehOutro ? OUTRO_SERVICO : initial.serviceType,
        outroTexto: ehOutro ? initial.serviceType : "",
        quantidade: "1",
        valorUnitario: initial.value != null ? String(initial.value) : "",
      },
    ];
  }
  return [novoItem()];
}

export default function OrcamentoForm({ clients, initial, onSave, onCancel, onClienteCriado, saving }) {
  const [clientId, setClientId] = useState(initial?.clienteId || clients[0]?.id || NOVO_CLIENTE);
  const [savingNovoCliente, setSavingNovoCliente] = useState(false);
  const [erroNovoCliente, setErroNovoCliente] = useState("");
  const [itens, setItens] = useState(() => itensIniciais(initial));
  const [mensagemCapa, setMensagemCapa] = useState(initial?.mensagemCapa || "");
  const [validoAte, setValidoAte] = useState(initial?.validoAte ? initial.validoAte.slice(0, 10) : "");
  const [observacoes, setObservacoes] = useState(initial?.observacoes || "");
  const [emailsCopia, setEmailsCopia] = useState(initial?.emailsCopia || "");
  const [descontoAtivo, setDescontoAtivo] = useState(Boolean(initial?.descontoAvistaPercentual));
  const [descontoPercentual, setDescontoPercentual] = useState(
    initial?.descontoAvistaPercentual ? String(initial.descontoAvistaPercentual) : ""
  );

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

  const atualizarItem = (idx, campo, valor) => {
    setItens((prev) => prev.map((it, i) => (i === idx ? { ...it, [campo]: valor } : it)));
  };
  const adicionarItem = () => setItens((prev) => [...prev, novoItem()]);
  const removerItem = (idx) => setItens((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const totalCalculado = itens.reduce(
    (acc, it) => acc + (Number(it.quantidade) || 0) * (Number(it.valorUnitario) || 0),
    0
  );

  const submit = () => {
    if (!clientId || clientId === NOVO_CLIENTE) return;
    const itensPayload = itens.map((it) => ({
      descricao: it.tipo === OUTRO_SERVICO ? it.outroTexto.trim() : it.tipo,
      quantidade: Number(it.quantidade) || 1,
      valorUnitario: Number(it.valorUnitario),
    }));
    if (itensPayload.some((it) => !it.descricao || !it.valorUnitario)) return;
    onSave({
      clienteId: clientId,
      itens: itensPayload,
      validoAte: validoAte || null,
      observacoes,
      mensagemCapa: mensagemCapa.trim() || null,
      descontoAvistaPercentual: descontoAtivo && descontoPercentual ? Number(descontoPercentual) : null,
      emailsCopia: emailsCopia.trim() || null,
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
          <label className="text-[11px] font-bold uppercase tracking-wide text-[rgb(var(--ink))]">Itens</label>
          <div className="flex flex-col gap-2">
            {itens.map((it, idx) => (
              <div key={idx} className="border border-[rgb(var(--border-strong)/0.25)] p-2 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <select
                    value={it.tipo}
                    onChange={(e) => atualizarItem(idx, "tipo", e.target.value)}
                    className="flex-1 border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
                  >
                    {SERVICE_TYPES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {itens.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removerItem(idx)}
                      className="text-[rgb(var(--stone))] hover:text-[#A02018] transition-colors p-1 shrink-0"
                      title="Remover item"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {it.tipo === OUTRO_SERVICO && (
                  <input
                    value={it.outroTexto}
                    onChange={(e) => atualizarItem(idx, "outroTexto", e.target.value)}
                    placeholder="Especifique o serviço (ex: limpeza de coluna)"
                    className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
                  />
                )}

                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    value={it.quantidade}
                    onChange={(e) => atualizarItem(idx, "quantidade", e.target.value)}
                    placeholder="Qtd."
                    className="w-20 border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
                  />
                  <input
                    type="number"
                    value={it.valorUnitario}
                    onChange={(e) => atualizarItem(idx, "valorUnitario", e.target.value)}
                    placeholder="Valor unitário (R$)"
                    className="flex-1 border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={adicionarItem}
            className="flex items-center justify-center gap-1.5 border border-dashed border-[rgb(var(--border-strong)/0.4)] text-[rgb(var(--ink))] text-xs font-bold uppercase py-1.5 hover:bg-[#142D65]/5 transition-colors"
          >
            <Plus size={14} /> Adicionar item
          </button>

          <p className="text-right text-sm font-bold text-[rgb(var(--ink-strong)/1)]">
            Total: R$ {formatMoeda(totalCalculado)}
          </p>

          <textarea
            value={mensagemCapa}
            onChange={(e) => setMensagemCapa(e.target.value)}
            placeholder="Mensagem de capa / oferta (opcional) — ex: desconto, condição à vista, prazo. Aparece no topo do PDF e do e-mail. Deixe em branco pra não mostrar nada"
            rows={2}
            className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] resize-none"
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

          <div className="border border-[rgb(var(--border-strong)/0.25)] p-2 flex flex-col gap-1.5">
            <label className="flex items-center gap-2 text-sm font-bold text-[rgb(var(--ink-strong)/1)]">
              <input
                type="checkbox"
                checked={descontoAtivo}
                onChange={(e) => setDescontoAtivo(e.target.checked)}
              />
              Oferecer desconto à vista
            </label>
            {descontoAtivo && (
              <>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={descontoPercentual}
                    onChange={(e) => setDescontoPercentual(e.target.value)}
                    placeholder="% de desconto"
                    className="w-28 border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
                  />
                  <span className="text-xs text-[rgb(var(--stone))]">
                    % à vista{validoAte ? "" : " — defina a validade acima pra incluir o prazo na frase"}
                  </span>
                </div>
                {descontoPercentual && (
                  <p className="text-xs italic text-[rgb(var(--ink))]">
                    Vai aparecer: "
                    {montarMensagemDescontoAvista({
                      descontoAvistaPercentual: descontoPercentual,
                      validoAte,
                    })}
                    "
                  </p>
                )}
              </>
            )}
          </div>

          <div>
            <input
              value={emailsCopia}
              onChange={(e) => setEmailsCopia(e.target.value)}
              placeholder="E-mails em cópia (CC) — separados por vírgula (opcional)"
              className="w-full border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
            />
            <p className="mt-1 text-[11px] text-[rgb(var(--stone))]">
              Ex: financeiro@empresa.com, gerente@empresa.com — recebem cópia junto com o cliente ao enviar por e-mail.
            </p>
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
