"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { LogIn } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    const result = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      setError("E-mail ou senha inválidos.");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
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
      <p className="text-xs text-[rgb(var(--stone))] mb-6 text-center">Acesso ao painel de operações</p>

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
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-[rgb(var(--ink))]">
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          <LogIn size={14} />
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <Link
        href="/esqueci-senha"
        className="mt-4 flex items-center justify-center text-xs font-semibold text-[rgb(var(--stone))] hover:text-[#A02018] transition-colors"
      >
        Esqueci minha senha
      </Link>
    </div>
  );
}
