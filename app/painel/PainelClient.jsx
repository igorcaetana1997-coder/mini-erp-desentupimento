"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, UserPlus, Trash2, Handshake } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ClientForm from "@/components/ClientForm";
import OsForm from "@/components/OsForm";
import Ticket from "@/components/Ticket";
import TicketActions from "@/components/TicketActions";
import { formatEndereco } from "@/lib/formatEndereco";

export default function PainelClient() {
  const [clients, setClients] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [parceiros, setParceiros] = useState([]);
  const [osList, setOsList] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const [showClientForm, setShowClientForm] = useState(false);
  const [showTecnicoForm, setShowTecnicoForm] = useState(false);
  const [showParceiroForm, setShowParceiroForm] = useState(false);
  const [showOsForm, setShowOsForm] = useState(false);

  const [savingClient, setSavingClient] = useState(false);
  const [savingTecnico, setSavingTecnico] = useState(false);
  const [savingParceiro, setSavingParceiro] = useState(false);
  const [savingOs, setSavingOs] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirmClientId, setConfirmClientId] = useState(null);
  const [confirmTecnicoId, setConfirmTecnicoId] = useState(null);
  const [confirmParceiroId, setConfirmParceiroId] = useState(null);

  const loadAll = async () => {
    try {
      const [clientesRes, tecnicosRes, parceirosRes, ordensRes] = await Promise.all([
        fetch("/api/clientes"),
        fetch("/api/tecnicos"),
        fetch("/api/parceiros"),
        fetch("/api/ordens"),
      ]);
      if (!clientesRes.ok || !tecnicosRes.ok || !parceirosRes.ok || !ordensRes.ok) {
        throw new Error("Falha ao carregar dados");
      }
      setClients(await clientesRes.json());
      setTecnicos(await tecnicosRes.json());
      setParceiros(await parceirosRes.json());
      setOsList(await ordensRes.json());
    } catch (e) {
      setError("Não foi possível carregar os dados. Tente recarregar a página.");
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const addClient = async (data) => {
    setSavingClient(true);
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setClients((prev) => [created, ...prev]);
      setShowClientForm(false);
    } catch {
      setError("Não foi possível salvar o cliente.");
    } finally {
      setSavingClient(false);
    }
  };

  const addTecnico = async (data) => {
    setSavingTecnico(true);
    try {
      const res = await fetch("/api/tecnicos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar técnico");
      setTecnicos((prev) => [...prev, json].sort((a, b) => a.name.localeCompare(b.name)));
      setShowTecnicoForm(false);
    } catch (e) {
      setError(e.message || "Não foi possível salvar o técnico.");
    } finally {
      setSavingTecnico(false);
    }
  };

  const addParceiro = async (data) => {
    setSavingParceiro(true);
    try {
      const res = await fetch("/api/parceiros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar parceiro");
      setParceiros((prev) => [json, ...prev]);
      setShowParceiroForm(false);
    } catch (e) {
      setError(e.message || "Não foi possível salvar o parceiro.");
    } finally {
      setSavingParceiro(false);
    }
  };

  const addOs = async (data) => {
    setSavingOs(true);
    try {
      const res = await fetch("/api/ordens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setOsList((prev) => [created, ...prev]);
      setShowOsForm(false);
    } catch {
      setError("Não foi possível abrir a ordem de serviço.");
    } finally {
      setSavingOs(false);
    }
  };

  const patchOs = async (id, url, body, errorMessage) => {
    setBusyId(id);
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || errorMessage);
      setOsList((prev) => prev.map((os) => (os.id === id ? json : os)));
    } catch (e) {
      setError(e.message || errorMessage);
    } finally {
      setBusyId(null);
    }
  };

  const handleAvancar = (id) => patchOs(id, `/api/ordens/${id}/avancar`, null, "Não foi possível avançar a OS.");
  const handleRecusar = (id, motivo) =>
    patchOs(id, `/api/ordens/${id}/recusar`, { motivo }, "Não foi possível recusar a OS.");
  const handleConcluir = (id, payload) =>
    patchOs(id, `/api/ordens/${id}/concluir`, payload, "Não foi possível concluir a OS.");
  const handleReabrir = (id, technicianId) =>
    patchOs(id, `/api/ordens/${id}`, { status: "aberta", technicianId }, "Não foi possível reabrir a OS.");
  const handleSalvarMateriais = (id, materiais) =>
    patchOs(id, `/api/ordens/${id}`, { materiais }, "Não foi possível salvar os materiais.");
  const handleSalvarAvaliacao = (id, avaliacaoNota) =>
    patchOs(id, `/api/ordens/${id}`, { avaliacaoNota }, "Não foi possível salvar a avaliação.");
  const handleFotoAdicionada = (id, foto) =>
    setOsList((prev) => prev.map((os) => (os.id === id ? { ...os, fotos: [...(os.fotos || []), foto] } : os)));
  const handleFotoRemovida = async (id, fotoId) => {
    await fetch(`/api/ordens/${id}/fotos/${fotoId}`, { method: "DELETE" });
    setOsList((prev) =>
      prev.map((os) => (os.id === id ? { ...os, fotos: os.fotos.filter((f) => f.id !== fotoId) } : os))
    );
  };
  const handleSalvarValor = (id, value) =>
    patchOs(id, `/api/ordens/${id}`, { value }, "Não foi possível salvar o valor.");
  const handleRegistrarPagamento = (id, valorPago) =>
    patchOs(id, `/api/ordens/${id}`, { valorPago }, "Não foi possível registrar o pagamento.");
  const handleEditarOs = (id, payload) =>
    patchOs(id, `/api/ordens/${id}`, payload, "Não foi possível salvar as alterações da OS.");

  const handleExcluir = async (id) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/ordens/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível excluir a OS.");
      setOsList((prev) => prev.filter((os) => os.id !== id));
    } catch (e) {
      setError(e.message || "Não foi possível excluir a OS.");
    } finally {
      setBusyId(null);
    }
  };

  const handleExcluirCliente = async (id) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível excluir o cliente.");
      setClients((prev) => prev.filter((c) => c.id !== id));
      setConfirmClientId(null);
    } catch (e) {
      setError(e.message || "Não foi possível excluir o cliente.");
    } finally {
      setBusyId(null);
    }
  };

  const handleExcluirTecnico = async (id) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/tecnicos/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível excluir o técnico.");
      setTecnicos((prev) => prev.filter((t) => t.id !== id));
      setConfirmTecnicoId(null);
    } catch (e) {
      setError(e.message || "Não foi possível excluir o técnico.");
    } finally {
      setBusyId(null);
    }
  };

  const handleExcluirParceiro = async (id) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/parceiros/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível excluir o parceiro.");
      setParceiros((prev) => prev.filter((p) => p.id !== id));
      setConfirmParceiroId(null);
    } catch (e) {
      setError(e.message || "Não foi possível excluir o parceiro.");
    } finally {
      setBusyId(null);
    }
  };

  if (!loaded) {
    return <div className="max-w-5xl mx-auto p-6 text-[rgb(var(--ink))] text-sm">Carregando…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {error && (
        <div className="mb-4 border border-[#A02018]/40 bg-[#A02018]/10 text-[#A02018] text-sm px-3 py-2 flex items-center justify-between">
          {error}
          <button onClick={() => setError("")} className="font-bold ml-3">
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Clientes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black uppercase tracking-tight text-[rgb(var(--ink-strong)/1)]">
              Clientes <span className="text-[rgb(var(--stone))] font-normal">({clients.length})</span>
            </h2>
            <button
              onClick={() => setShowClientForm(true)}
              className="flex items-center gap-1 bg-[#1E7A52] text-[#F2EFE9] text-xs font-bold uppercase px-3 py-1.5 hover:bg-[#175F40] transition-colors"
            >
              <Plus size={14} /> Novo
            </button>
          </div>

          {showClientForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="w-full max-w-md my-4">
                <ClientForm
                  saving={savingClient}
                  onSave={addClient}
                  onCancel={() => setShowClientForm(false)}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {clients.length === 0 && !showClientForm && (
              <EmptyState text="Nenhum cliente cadastrado ainda. Clique em Novo para começar." />
            )}
            {clients.slice(0, 3).map((c) => (
              <div
                key={c.id}
                className="bg-[rgb(var(--input-bg)/0.60)] border border-[rgb(var(--border-strong)/0.2)] px-3 py-2 flex items-center justify-between gap-2 hover:bg-[rgb(var(--input-bg))] transition-colors"
              >
                <Link href={`/painel/clientes/${c.id}`} className="min-w-0 flex-1">
                  <p className="font-bold text-[rgb(var(--ink-strong)/1)] text-sm truncate">{c.name}</p>
                  <p className="text-xs text-[rgb(var(--ink))]">{c.phone}</p>
                  {formatEndereco(c) && <p className="text-xs text-[rgb(var(--stone))] truncate">{formatEndereco(c)}</p>}
                </Link>
                {confirmClientId === c.id ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmClientId(null)}
                      className="text-[11px] text-[rgb(var(--ink))] hover:text-[rgb(var(--ink-strong)/1)] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={busyId === c.id}
                      onClick={() => handleExcluirCliente(c.id)}
                      className="text-[11px] font-bold text-[#A02018] hover:underline disabled:opacity-50"
                    >
                      Confirmar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClientId(c.id)}
                    className="shrink-0 text-[rgb(var(--stone))] hover:text-[#A02018] transition-colors p-1"
                    title="Excluir cliente"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            {clients.length > 0 && (
              <Link
                href="/painel/clientes"
                className="text-xs font-bold uppercase text-[rgb(var(--ink-strong)/1)] hover:underline text-center py-1"
              >
                {clients.length > 3 ? `Ver mais (${clients.length - 3}) →` : "Ver lista completa →"}
              </Link>
            )}
          </div>
        </div>

        {/* Técnicos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black uppercase tracking-tight text-[rgb(var(--ink-strong)/1)]">
              Técnicos <span className="text-[rgb(var(--stone))] font-normal">({tecnicos.length})</span>
            </h2>
            <button
              onClick={() => setShowTecnicoForm(true)}
              className="flex items-center gap-1 bg-[#1E7A52] text-[#F2EFE9] text-xs font-bold uppercase px-3 py-1.5 hover:bg-[#175F40] transition-colors"
            >
              <UserPlus size={14} /> Novo
            </button>
          </div>

          {showTecnicoForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="w-full max-w-md my-4">
                <TecnicoForm
                  saving={savingTecnico}
                  onSave={addTecnico}
                  onCancel={() => setShowTecnicoForm(false)}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {tecnicos.length === 0 && !showTecnicoForm && (
              <EmptyState text="Nenhum técnico cadastrado ainda." />
            )}
            {tecnicos.slice(0, 3).map((t) => (
              <div
                key={t.id}
                className="bg-[rgb(var(--input-bg)/0.60)] border border-[rgb(var(--border-strong)/0.2)] px-3 py-2 flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[rgb(var(--ink-strong)/1)] text-sm truncate">{t.name}</p>
                  <p className="text-xs text-[rgb(var(--ink))]">{t.email}</p>
                  {t.phone && <p className="text-xs text-[rgb(var(--stone))]">{t.phone}</p>}
                </div>
                {confirmTecnicoId === t.id ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmTecnicoId(null)}
                      className="text-[11px] text-[rgb(var(--ink))] hover:text-[rgb(var(--ink-strong)/1)] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={busyId === t.id}
                      onClick={() => handleExcluirTecnico(t.id)}
                      className="text-[11px] font-bold text-[#A02018] hover:underline disabled:opacity-50"
                    >
                      Confirmar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmTecnicoId(t.id)}
                    className="shrink-0 text-[rgb(var(--stone))] hover:text-[#A02018] transition-colors p-1"
                    title="Excluir técnico"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            {tecnicos.length > 0 && (
              <Link
                href="/painel/tecnicos"
                className="text-xs font-bold uppercase text-[rgb(var(--ink-strong)/1)] hover:underline text-center py-1"
              >
                {tecnicos.length > 3 ? `Ver mais (${tecnicos.length - 3}) →` : "Ver lista completa →"}
              </Link>
            )}
          </div>
        </div>

        {/* Parceiros (terceirizados) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black uppercase tracking-tight text-[rgb(var(--ink-strong)/1)]">
              Parceiros <span className="text-[rgb(var(--stone))] font-normal">({parceiros.length})</span>
            </h2>
            <button
              onClick={() => setShowParceiroForm(true)}
              className="flex items-center gap-1 bg-[#1E7A52] text-[#F2EFE9] text-xs font-bold uppercase px-3 py-1.5 hover:bg-[#175F40] transition-colors"
            >
              <Handshake size={14} /> Novo
            </button>
          </div>

          {showParceiroForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="w-full max-w-md my-4">
                <ParceiroForm saving={savingParceiro} onSave={addParceiro} onCancel={() => setShowParceiroForm(false)} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {parceiros.length === 0 && !showParceiroForm && (
              <EmptyState text="Nenhum parceiro/terceirizado cadastrado ainda." />
            )}
            {parceiros.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className="bg-[rgb(var(--input-bg)/0.60)] border border-[rgb(var(--border-strong)/0.2)] px-3 py-2 flex items-center justify-between gap-2 hover:bg-[rgb(var(--input-bg))] transition-colors"
              >
                <Link href={`/painel/parceiros/${p.id}`} className="min-w-0 flex-1">
                  <p className="font-bold text-[rgb(var(--ink-strong)/1)] text-sm truncate">{p.name}</p>
                  {p.phone && <p className="text-xs text-[rgb(var(--ink))]">{p.phone}</p>}
                </Link>
                {confirmParceiroId === p.id ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmParceiroId(null)}
                      className="text-[11px] text-[rgb(var(--ink))] hover:text-[rgb(var(--ink-strong)/1)] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() => handleExcluirParceiro(p.id)}
                      className="text-[11px] font-bold text-[#A02018] hover:underline disabled:opacity-50"
                    >
                      Confirmar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmParceiroId(p.id)}
                    className="shrink-0 text-[rgb(var(--stone))] hover:text-[#A02018] transition-colors p-1"
                    title="Excluir parceiro"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            {parceiros.length > 0 && (
              <Link
                href="/painel/parceiros"
                className="text-xs font-bold uppercase text-[rgb(var(--ink-strong)/1)] hover:underline text-center py-1"
              >
                {parceiros.length > 3 ? `Ver mais (${parceiros.length - 3}) →` : "Ver lista completa →"}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Ordens de serviço */}
      <div className="mt-6 md:mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black uppercase tracking-tight text-[rgb(var(--ink-strong)/1)]">
            Ordens de serviço{" "}
            <span className="text-[rgb(var(--stone))] font-normal">({osList.length})</span>
          </h2>
          <button
            onClick={() => setShowOsForm(true)}
            disabled={clients.length === 0}
            className="flex items-center gap-1 bg-[#E8A33D] text-[#1a1208] text-xs font-bold uppercase px-3 py-1.5 hover:bg-[#d99527] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={14} /> Nova OS
          </button>
        </div>

        {clients.length === 0 && (
          <p className="text-xs text-[rgb(var(--stone))] mb-2">
            Cadastre um cliente antes de abrir uma OS.
          </p>
        )}

        {showOsForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="w-full max-w-lg my-4">
              <OsForm
                clients={clients}
                tecnicos={tecnicos}
                parceiros={parceiros}
                saving={savingOs}
                onSave={addOs}
                onCancel={() => setShowOsForm(false)}
              />
            </div>
          </div>
        )}

        <div>
          {osList.length === 0 && (
            <EmptyState text="Nenhuma ordem de serviço aberta. Crie a primeira." />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {osList.slice(0, 3).map((os) => (
              <Ticket
                key={os.id}
                os={os}
                actions={
                  <TicketActions
                    os={os}
                    role="admin"
                    isOwner={false}
                    tecnicos={tecnicos}
                    parceiros={parceiros}
                    busy={busyId === os.id}
                    onAvancar={handleAvancar}
                    onRecusar={handleRecusar}
                    onConcluir={handleConcluir}
                    onReabrir={handleReabrir}
                    onSalvarMateriais={handleSalvarMateriais}
                    onSalvarAvaliacao={handleSalvarAvaliacao}
                    onFotoAdicionada={handleFotoAdicionada}
                    onFotoRemovida={handleFotoRemovida}
                    onRegistrarPagamento={handleRegistrarPagamento}
                    onEditarOs={handleEditarOs}
                    onExcluir={handleExcluir}
                  />
                }
              />
            ))}
          </div>
          {osList.length > 0 && (
            <div className="mt-3">
              <Link
                href="/painel/ordens"
                className="text-xs font-bold uppercase text-[rgb(var(--ink-strong)/1)] hover:underline text-center py-1 block"
              >
                {osList.length > 3 ? `Ver mais (${osList.length - 3}) →` : "Ver lista completa →"}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TecnicoForm({ onSave, onCancel, saving }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const submit = () => {
    if (!name.trim() || !email.trim() || password.length < 6) return;
    onSave({ name: name.trim(), email: email.trim(), phone: phone.trim(), password });
  };

  return (
    <div className="bg-[rgb(var(--input-bg))] border-2 border-[rgb(var(--border-strong)/1)] p-3 mb-3 flex flex-col gap-2">
      <p className="font-bold text-[rgb(var(--ink-strong)/1)] text-sm uppercase">Novo técnico</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do técnico"
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-mail de acesso"
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Telefone (opcional)"
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha (mín. 6 caracteres)"
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
      />
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          type="button"
          className="flex-1 border border-[rgb(var(--border-strong)/0.3)] text-[rgb(var(--ink-strong)/1)] text-xs font-bold uppercase py-2 hover:bg-[#142D65]/5 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={submit}
          disabled={saving}
          type="button"
          className="flex-1 bg-[#1E7A52] text-[#F2EFE9] text-xs font-bold uppercase py-2 hover:bg-[#175F40] transition-colors disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar técnico"}
        </button>
      </div>
    </div>
  );
}

function ParceiroForm({ onSave, onCancel, saving }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [documento, setDocumento] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      documento: documento.trim(),
      observacoes: observacoes.trim(),
    });
  };

  return (
    <div className="bg-[rgb(var(--input-bg))] border-2 border-[rgb(var(--border-strong)/1)] p-3 mb-3 flex flex-col gap-2">
      <p className="font-bold text-[rgb(var(--ink-strong)/1)] text-sm uppercase">Novo parceiro</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do parceiro/empresa terceirizada"
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Telefone (opcional)"
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-mail (opcional)"
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
      />
      <input
        value={documento}
        onChange={(e) => setDocumento(e.target.value)}
        placeholder="CPF/CNPJ (opcional)"
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
      />
      <textarea
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        placeholder="Observações (opcional)"
        rows={2}
        className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52] resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          type="button"
          className="flex-1 border border-[rgb(var(--border-strong)/0.3)] text-[rgb(var(--ink-strong)/1)] text-xs font-bold uppercase py-2 hover:bg-[#142D65]/5 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={submit}
          disabled={saving}
          type="button"
          className="flex-1 bg-[#1E7A52] text-[#F2EFE9] text-xs font-bold uppercase py-2 hover:bg-[#175F40] transition-colors disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar parceiro"}
        </button>
      </div>
    </div>
  );
}
