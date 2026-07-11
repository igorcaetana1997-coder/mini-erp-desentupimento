"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { KeyRound } from "lucide-react";

function RedefinirSenhaForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Link inválido. Solicite uma nova redefinição de senha.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmar) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/redefinir-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível redefinir a senha.");
      }
      setSucesso(true);
      setTimeout(() => router.push("/login"), 2000);
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
        <p className="text-xs text-[rgb(var(--stone))] mb-6 text-center">Definir nova senha</p>

        {sucesso ? (
          <p className="text-sm text-[rgb(var(--ink))] text-center">
            Senha redefinida com sucesso! Redirecionando para o login…
          </p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-[rgb(var(--ink))]">
                Nova senha
              </label>
              <input
                autoFocus
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex items-center justify-center gap-1.5 bg-[#142D65] text-[#F2EFE9] text-xs font-bold uppercase tracking-wide py-2.5 hover:bg-[#203D7B] transition-colors disabled:opacity-50"
            >
              <KeyRound size={14} />
              {loading ? "Salvando…" : "Redefinir senha"}
            </button>
          </form>
        )}

        <Link
          href="/login"
          className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-[rgb(var(--stone))] hover:text-[#A02018] transition-colors"
        >
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={null}>
      <RedefinirSenhaForm />
    </Suspense>
  );
}
