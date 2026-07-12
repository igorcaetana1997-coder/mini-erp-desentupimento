"use client";

import { useState } from "react";
import { X } from "lucide-react";

const UF_OPTIONS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

function formatCep(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export default function ClientForm({ initial, onSave, onCancel, saving }) {
  const [name, setName] = useState(initial?.name || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [documento, setDocumento] = useState(initial?.documento || "");
  const [dataNascimento, setDataNascimento] = useState(initial?.dataNascimento?.slice(0, 10) || "");
  const [cep, setCep] = useState(initial?.cep || "");
  const [logradouro, setLogradouro] = useState(initial?.logradouro || "");
  const [numero, setNumero] = useState(initial?.numero || "");
  const [complemento, setComplemento] = useState(initial?.complemento || "");
  const [bairro, setBairro] = useState(initial?.bairro || "");
  const [cidade, setCidade] = useState(initial?.cidade || "");
  const [uf, setUf] = useState(initial?.uf || "");
  const [observacoes, setObservacoes] = useState(initial?.observacoes || "");
  const [buscandoCep, setBuscandoCep] = useState(false);

  const buscarCep = async () => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setLogradouro((prev) => prev || data.logradouro || "");
        setBairro((prev) => prev || data.bairro || "");
        setCidade((prev) => prev || data.localidade || "");
        setUf((prev) => prev || data.uf || "");
        if (data.complemento) setComplemento((prev) => prev || data.complemento);
      }
    } catch {
      // falha silenciosa: usuário preenche o endereço manualmente
    } finally {
      setBuscandoCep(false);
    }
  };

  const submit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      documento: documento.trim(),
      dataNascimento: dataNascimento || null,
      cep: cep.trim(),
      logradouro: logradouro.trim(),
      numero: numero.trim(),
      complemento: complemento.trim(),
      bairro: bairro.trim(),
      cidade: cidade.trim(),
      uf,
      observacoes: observacoes.trim(),
    });
  };

  return (
    <div className="bg-[rgb(var(--input-bg))] border-2 border-[rgb(var(--border-strong)/1)] p-3 mb-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="font-bold text-[rgb(var(--ink-strong)/1)] text-sm uppercase">
          {initial ? "Editar cliente" : "Novo cliente"}
        </p>
        <button onClick={onCancel} type="button">
          <X size={16} className="text-[rgb(var(--stone))]" />
        </button>
      </div>

      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do cliente"
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
      />

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Telefone"
          className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] flex-1"
        />
        <div>
          <label className="text-[10px] font-bold uppercase text-[rgb(var(--ink))]">Aniversário</label>
          <input
            type="date"
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
            className="block w-full border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail (opcional)"
          className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] flex-1"
        />
        <input
          value={documento}
          onChange={(e) => setDocumento(e.target.value)}
          placeholder="CPF/CNPJ (opcional)"
          className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] flex-1"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          value={cep}
          onChange={(e) => setCep(formatCep(e.target.value))}
          onBlur={buscarCep}
          placeholder="CEP"
          className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] w-28"
        />
        {buscandoCep && <span className="text-[11px] text-[rgb(var(--stone))]">buscando endereço…</span>}
      </div>

      <input
        value={logradouro}
        onChange={(e) => setLogradouro(e.target.value)}
        placeholder="Logradouro (rua, avenida...)"
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
      />

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          placeholder="Número"
          className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] sm:w-24"
        />
        <input
          value={complemento}
          onChange={(e) => setComplemento(e.target.value)}
          placeholder="Complemento (apto, bloco...)"
          className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] flex-1"
        />
      </div>

      <input
        value={bairro}
        onChange={(e) => setBairro(e.target.value)}
        placeholder="Bairro"
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
      />

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          placeholder="Cidade"
          className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] flex-1"
        />
        <select
          value={uf}
          onChange={(e) => setUf(e.target.value)}
          className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] sm:w-20"
        >
          <option value="">UF</option>
          {UF_OPTIONS.map((sigla) => (
            <option key={sigla} value={sigla}>
              {sigla}
            </option>
          ))}
        </select>
      </div>

      <textarea
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        placeholder="Observações (ex: acesso ao imóvel, ponto de referência, animais no local)"
        rows={2}
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] resize-none"
      />

      <button
        onClick={submit}
        disabled={saving}
        type="button"
        className="bg-[#1E7A52] text-[#F2EFE9] text-xs font-bold uppercase py-2 hover:bg-[#175F40] transition-colors disabled:opacity-50"
      >
        {saving ? "Salvando…" : initial ? "Salvar alterações" : "Salvar cliente"}
      </button>
    </div>
  );
}
