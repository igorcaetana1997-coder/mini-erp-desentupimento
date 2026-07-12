"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { UserCog } from "lucide-react";

export default function DadosAcessoClient() {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    if (session?.user) {
      setEmail(session.user.email || "");
      setUsername(session.user.username || "");
    }
  }, [session]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSucesso("");

    if (!email.trim() || !senhaAtual) {
      setError("E-mail e senha atual são obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/conta", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), username: username.trim(), senhaAtual }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível salvar os dados de acesso.");
      }
      setSucesso("Dados de acesso atualizados. Da próxima vez, entre com o novo e-mail/usuário.");
      setSenhaAtual("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto">
      <h1 className="text-sm font-bold uppercase tracking-wide text-[rgb(var(--ink))] mb-4">
        Dados de acesso
      </h1>

      <form
        onSubmit={submit}
        className="bg-[rgb(var(--surface))] border-2 border-[rgb(var(--border-strong)/1)] shadow-[6px_6px_0_#142D65] p-6 flex flex-col gap-3"
      >
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-[rgb(var(--ink))]">
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1 border border-[rgb(var(--border-strong)/0.3)] px-2 py-2 text-sm outline-none focus:border-[#1E7A52] bg-[rgb(var(--input-bg))]"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-[rgb(var(--ink))]">
            Nome de usuário (opcional)
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ex: realleaderdesentupidora"
            className="w-full mt-1 border border-[rgb(var(--border-strong)/0.3)] px-2 py-2 text-sm outline-none focus:border-[#1E7A52] bg-[rgb(var(--input-bg))]"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-[rgb(var(--ink))]">
            Senha atual (pra confirmar)
          </label>
          <input
            type="password"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
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
          <UserCog size={14} />
          {loading ? "Salvando…" : "Salvar dados de acesso"}
        </button>
      </form>
    </div>
  );
}
