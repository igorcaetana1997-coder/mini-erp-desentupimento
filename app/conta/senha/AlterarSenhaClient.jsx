"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";

export default function AlterarSenhaClient() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sucesso, setSucesso] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSucesso("");

    if (novaSenha.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmar) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/senha", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível alterar a senha.");
      }
      setSucesso("Senha alterada com sucesso.");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmar("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto">
      <h1 className="text-sm font-bold uppercase tracking-wide text-[rgb(var(--ink))] mb-4">
        Alterar senha
      </h1>

      <form
        onSubmit={submit}
        className="bg-[rgb(var(--surface))] border-2 border-[rgb(var(--border-strong)/1)] shadow-[6px_6px_0_#A02018] p-6 flex flex-col gap-3"
      >
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-[rgb(var(--ink))]">
            Senha atual
          </label>
          <input
            type="password"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            placeholder="••••••••"
            className="w-full mt-1 border border-[rgb(var(--border-strong)/0.3)] px-2 py-2 text-sm outline-none focus:border-[#1E7A52] bg-[rgb(var(--input-bg))]"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-[rgb(var(--ink))]">
            Nova senha
          </label>
          <input
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            placeholder="••••••••"
            className="w-full mt-1 border border-[rgb(var(--border-strong)/0.3)] px-2 py-2 text-sm outline-none focus:border-[#1E7A52] bg-[rgb(var(--input-bg))]"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-[rgb(var(--ink))]">
            Confirmar nova senha
          </label>
          <input
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            placeholder="••••••••"
            className="w-full mt-1 border border-[rgb(var(--border-strong)/0.3)] px-2 py-2 text-sm outline-none focus:border-[#1E7A52] bg-[rgb(var(--input-bg))]"
          />
        </div>

        {error && (
          <p className="text-xs font-semibold text-[#A02018] border border-[#A02018]/40 bg-[#A02018]/10 px-2 py-1.5">
            {error}
          </p>
        )}
        {sucesso && (
          <p className="text-xs font-semibold text-[#1E7A52] border border-[#1E7A52]/40 bg-[#1E7A52]/10 px-2 py-1.5">
            {sucesso}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex items-center justify-center gap-1.5 bg-[#142D65] text-[#F2EFE9] text-xs font-bold uppercase tracking-wide py-2.5 hover:bg-[#203D7B] transition-colors disabled:opacity-50"
        >
          <KeyRound size={14} />
          {loading ? "Salvando…" : "Alterar senha"}
        </button>
      </form>
    </div>
  );
}
