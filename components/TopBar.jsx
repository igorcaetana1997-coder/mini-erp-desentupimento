"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Smartphone,
  LogOut,
  CalendarDays,
  Wallet,
  LayoutGrid,
  KeyRound,
  Menu,
  X,
  Trash2,
  FileText,
  Landmark,
  Users,
  History,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { isGestor } from "@/lib/permissions";

const GESTOR_LINKS = [
  { href: "/painel/visao-geral", label: "Visão Geral", icon: LayoutGrid },
  { href: "/painel", label: "Painel", icon: LayoutDashboard },
  { href: "/painel/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/painel/orcamentos", label: "Orçamentos", icon: FileText },
  { href: "/painel/contas", label: "Contas", icon: Landmark },
  { href: "/painel/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/painel/lixeira", label: "Lixeira", icon: Trash2 },
  { href: "/painel/gerentes", label: "Gerentes", icon: Users, adminOnly: true },
  { href: "/painel/auditoria", label: "Auditoria", icon: History, adminOnly: true },
  { href: "/tecnico", label: "Técnico", icon: Smartphone },
];

export default function TopBar({ user }) {
  const pathname = usePathname();
  const isGestorUser = isGestor(user?.role);
  const isAdminReal = user?.role === "admin";
  const visibleLinks = GESTOR_LINKS.filter((l) => !l.adminOnly || isAdminReal);
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = (href) =>
    `flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
      pathname === href
        ? "bg-[#C6FE1F] text-[#A02018]"
        : "text-[#9a9a9a] hover:text-[#C6FE1F]"
    }`;

  return (
    <div className="print:hidden bg-[#0F0F0F] text-[#F2EFE9] sticky top-0 z-10 shadow-md">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src="/logo-horizontal-outline.png"
            alt="Real Leader Desentupidora"
            width={1800}
            height={603}
            priority
            className="h-11 w-auto shrink-0"
          />
          <p className="hidden sm:block text-[10px] text-[#9a9a9a] tracking-wide border-l border-[#9a9a9a]/30 pl-3 truncate">
            {isGestorUser ? "Painel de operações" : `Olá, ${user?.name?.split(" ")[0] || "técnico"}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isGestorUser && (
            <div className="hidden md:flex bg-[#1a1a1a] p-1 gap-1">
              {visibleLinks.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className={linkClass(href)}>
                  <Icon size={14} /> {label}
                </Link>
              ))}
            </div>
          )}
          {isGestorUser && (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#9a9a9a] hover:text-[#C6FE1F] transition-colors"
              title="Menu"
            >
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          )}
          <ThemeToggle />
          <Link
            href="/conta/senha"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#9a9a9a] hover:text-[#C6FE1F] transition-colors"
            title="Alterar senha"
          >
            <KeyRound size={14} />
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#9a9a9a] hover:text-[#C6FE1F] transition-colors"
            title="Sair"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {isGestorUser && menuOpen && (
        <div className="md:hidden flex flex-col bg-[#1a1a1a] px-2 pb-2 gap-1">
          {visibleLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={linkClass(href)}>
              <Icon size={14} /> {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
