"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserPlus, Trash2, Pencil, Search, X } from "lucide-react";
import EmptyState from "@/components/EmptyState";

export default function GerentesClient() {
  const [gerentes, setGerentes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [editando, setEditando] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/gerentes");
        if (!res.ok) throw new Error();
        setGerentes(await res.json());
      } catch {
        setError("Não foi possível carregar os gerentes.");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const addGerente = async (data) => {
    setSaving(true);
    try {
      const res = await fetch("/api/gerentes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar gerente");
      setGerentes((prev) => [...prev, json].sort((a, b) => a.name.localeCompare(b.name)));
      setShowForm(false);
    } catch (e) {
      setError(e.message || "Não foi possível salvar o gerente.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = async (id, data) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/gerentes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar gerente");
      setGerentes((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...json } : g)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditando(null);
    } catch (e) {
      setError(e.message || "Não foi possível salvar o gerente.");
    } finally {
      setSaving(false);
    }
  };

  const handleExcluir = async (id) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/gerentes/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível excluir o gerente.");
      setGerentes((prev) => prev.filter((g) => g.id !== id));
      setConfirmId(null);
    } catch (e) {
      setError(e.message || "Não foi possível excluir o gerente.");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return gerentes;
    return gerentes.filter((g) => {
      return (
        g.name?.toLowerCase().includes(q) ||
        g.email?.toLowerCase().includes(q) ||
        g.username?.toLowerCase().includes(q) ||
        g.phone?.toLowerCase().includes(q)
      );
    });
  }, [gerentes, query]);

  if (!loaded) {
    return <div className="max-w-3xl mx-auto p-6 text-[rgb(var(--ink))] text-sm">Carregando…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <Link
        href="/painel"
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-[rgb(var(--ink-strong)/1)] mb-4 hover:underline"
      >
        <ArrowLeft size={14} /> Voltar ao painel
      </Link>

      {error && (
        <div className="mb-4 border border-[#A02018]/40 bg-[#A02018]/10 text-[#A02018] text-sm px-3 py-2 flex items-center justify-between">
          {error}
          <button onClick={() => setError("")} className="font-bold ml-3">
            ×
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h1 className="font-black uppercase tracking-tight text-xl text-[rgb(var(--ink-strong)/1)]">
          Gerentes <span className="text-[rgb(var(--stone))] font-normal">({filtered.length})</span>
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 bg-[#1E7A52] text-[#F2EFE9] text-xs font-bold uppercase px-3 py-1.5 hover:bg-[#175F40] transition-colors"
        >
          <UserPlus size={14} /> Novo
        </button>
      </div>

      <p className="text-xs text-[rgb(var(--stone))] mb-3">
        Gerentes têm acesso a quase tudo que o admin acessa — exceto gerenciar outros gerentes e ver o log de
        auditoria.
      </p>

      {showForm && <GerenteForm saving={saving} onSave={addGerente} onCancel={() => setShowForm(false)} />}

      <div className="flex items-center gap-2 bg-[rgb(var(--input-bg)/0.70)] border border-[rgb(var(--border-strong)/0.2)] px-3 py-2 mb-3">
        <Search size={16} className="text-[rgb(var(--stone))]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, e-mail ou telefone"
          className="bg-transparent outline-none text-sm flex-1 text-[rgb(var(--ink-strong)/1)] placeholder:text-[rgb(var(--stone))]"
        />
      </div>

      <div className="flex flex-col gap-2">
        {gerentes.length === 0 && !showForm && <EmptyState text="Nenhum gerente cadastrado ainda." />}
        {gerentes.length > 0 && filtered.length === 0 && (
          <EmptyState text="Nenhum gerente encontrado para esse filtro." />
        )}
        {filtered.map((g) => (
          <div
            key={g.id}
            className="bg-[rgb(var(--input-bg)/0.60)] border border-[rgb(var(--border-strong)/0.2)] px-3 py-2 flex items-center justify-between gap-2"
          >
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[rgb(var(--ink-strong)/1)] text-sm truncate">{g.name}</p>
              <p className="text-xs text-[rgb(var(--ink))]">{g.email}</p>
              {g.username && <p className="text-xs text-[rgb(var(--ink))]">Usuário: {g.username}</p>}
              {g.phone && <p className="text-xs text-[rgb(var(--stone))]">{g.phone}</p>}
            </div>
            {confirmId === g.id ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmId(null)}
                  className="text-[11px] text-[rgb(var(--ink))] hover:text-[rgb(var(--ink-strong)/1)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={busyId === g.id}
                  onClick={() => handleExcluir(g.id)}
                  className="text-[11px] font-bold text-[#A02018] hover:underline disabled:opacity-50"
                >
                  Confirmar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditando(g)}
                  className="text-[rgb(var(--stone))] hover:text-[#1E7A52] transition-colors p-1"
                  title="Editar gerente"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmId(g.id)}
                  className="text-[rgb(var(--stone))] hover:text-[#A02018] transition-colors p-1"
                  title="Excluir gerente"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {editando && (
        <EditarGerenteModal
          gerente={editando}
          saving={saving}
          onConfirm={(data) => handleEditar(editando.id, data)}
          onCancel={() => setEditando(null)}
        />
      )}
    </div>
  );
}

function GerenteForm({ onSave, onCancel, saving }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const submit = () => {
    if (!name.trim() || !email.trim() || password.length < 6) return;
    onSave({ name: name.trim(), email: email.trim(), username: username.trim(), phone: phone.trim(), password });
  };

  return (
    <div className="bg-[rgb(var(--input-bg))] border-2 border-[rgb(var(--border-strong)/1)] p-3 mb-3 flex flex-col gap-2">
      <p className="font-bold text-[rgb(var(--ink-strong)/1)] text-sm uppercase">Novo gerente</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do gerente"
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
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Nome de usuário (opcional, alternativa ao e-mail)"
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
          {saving ? "Salvando…" : "Salvar gerente"}
        </button>
      </div>
    </div>
  );
}

function EditarGerenteModal({ gerente, onConfirm, onCancel, saving }) {
  const [name, setName] = useState(gerente.name);
  const [email, setEmail] = useState(gerente.email);
  const [username, setUsername] = useState(gerente.username || "");
  const [phone, setPhone] = useState(gerente.phone || "");

  const submit = () => {
    if (!name.trim() || !email.trim()) return;
    onConfirm({ name: name.trim(), email: email.trim(), username: username.trim(), phone: phone.trim() });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[rgb(var(--surface))] border-2 border-[rgb(var(--border-strong)/1)] w-full max-w-md p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="font-black uppercase text-[rgb(var(--ink-strong)/1)]">Editar gerente</p>
          <button onClick={onCancel} type="button">
            <X size={18} className="text-[rgb(var(--stone))]" />
          </button>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do gerente"
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
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nome de usuário (opcional)"
          className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Telefone (opcional)"
          className="border border-[rgb(var(--border-strong)/0.3)] px-2 py-1.5 text-sm outline-none focus:border-[#1E7A52]"
        />
        <button
          onClick={submit}
          disabled={saving}
          type="button"
          className="mt-1 bg-[#142D65] text-[#F2EFE9] text-xs font-bold uppercase py-2.5 hover:bg-[#203D7B] transition-colors disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}
