"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Smartphone, LogOut, CalendarDays, Wallet, LayoutGrid } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function TopBar({ user }) {
  const pathname = usePathname();
  const isAdmin = user?.role === "admin";

  const linkClass = (href) =>
    `flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
      pathname === href
        ? "bg-[#C6FE1F] text-[#A02018]"
        : "text-[#9a9a9a] hover:text-[#C6FE1F]"
    }`;

  return (
    <div className="bg-[#0F0F0F] text-[#F2EFE9] px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-md">
      <div className="flex items-center gap-3">
        <Image
          src="/logo-horizontal-outline.png"
          alt="Real Leader Desentupidora"
          width={1800}
          height={603}
          priority
          className="h-11 w-auto"
        />
        <p className="hidden sm:block text-[10px] text-[#9a9a9a] tracking-wide border-l border-[#9a9a9a]/30 pl-3">
          {isAdmin ? "Painel de operações" : `Olá, ${user?.name?.split(" ")[0] || "técnico"}`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {isAdmin && (
          <div className="flex bg-[#1a1a1a] p-1 gap-1 flex-wrap justify-end">
            <Link href="/painel/visao-geral" className={linkClass("/painel/visao-geral")}>
              <LayoutGrid size={14} /> Visão Geral
            </Link>
            <Link href="/painel" className={linkClass("/painel")}>
              <LayoutDashboard size={14} /> Painel
            </Link>
            <Link href="/painel/agenda" className={linkClass("/painel/agenda")}>
              <CalendarDays size={14} /> Agenda
            </Link>
            <Link href="/painel/financeiro" className={linkClass("/painel/financeiro")}>
              <Wallet size={14} /> Financeiro
            </Link>
            <Link href="/tecnico" className={linkClass("/tecnico")}>
              <Smartphone size={14} /> Técnico
            </Link>
          </div>
        )}
        <ThemeToggle />
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#9a9a9a] hover:text-[#C6FE1F] transition-colors"
          title="Sair"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}
