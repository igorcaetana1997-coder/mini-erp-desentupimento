"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { KeyRound, ArrowLeft } from "lucide-react";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Informe seu e-mail.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/esqueci-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Não foi possível processar o pedido.");
      }
      setEnviado(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#142D65] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[rgb(var(--surface))] border-2 border-[rgb(var(--border-strong)/1)] shadow-[6px_6px_0_#A02018] p-6">
        <div className="flex justify-center mb-3">
          <Image
            src="/logo-stacked-outline.png"
            alt="Real Leader Desentupidora"
            width={920}
            height={552}
            priority
            className="w-40 h-auto"
          />
        </div>
        <p className="text-xs text-[rgb(var(--stone))] mb-6 text-center">Recuperar acesso</p>

        {enviado ? (
          <p className="text-sm text-[rgb(var(--ink))] text-center">
            Se esse e-mail estiver cadastrado, você vai receber um link de redefinição em instantes.
          </p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-[rgb(var(--ink))]">
                E-mail
              </label>
              <input
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
                className="w-full mt-1 border border-[rgb(var(--border-strong)/0.3)] px-2 py-2 text-sm outline-none focus:border-[#1E7A52] bg-[rgb(var(--input-bg))]"
              />
            </div>

            {error && (
              <p className="text-xs font-semibold text-[#A02018] border border-[#A02018]/40 bg-[#A02018]/10 px-2 py-1.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex items-center justify-center gap-1.5 bg-[#142D65] text-[#F2EFE9] text-xs font-bold uppercase tracking-wide py-2.5 hover:bg-[#203D7B] transition-colors disabled:opacity-50"
            >
              <KeyRound size={14} />
              {loading ? "Enviando…" : "Enviar link de redefinição"}
            </button>
          </form>
        )}

        <Link
          href="/login"
          className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-[rgb(var(--stone))] hover:text-[#A02018] transition-colors"
        >
          <ArrowLeft size={12} /> Voltar para o login
        </Link>
      </div>
    </div>
  );
}
