import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import TopBar from "@/components/TopBar";
import ClienteDetalheClient from "./ClienteDetalheClient";

export default async function ClienteDetalhePage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/tecnico");

  return (
    <div className="min-h-screen bg-[rgb(var(--page-bg))] font-sans">
      <TopBar user={session.user} />
      <ClienteDetalheClient clienteId={params.id} />
    </div>
  );
}
