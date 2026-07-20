import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isGestor } from "@/lib/permissions";
import TopBar from "@/components/TopBar";
import OrcamentoDetalheClient from "./OrcamentoDetalheClient";

export default async function OrcamentoDetalhePage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!isGestor(session.user.role)) redirect("/tecnico");

  return (
    <div className="min-h-screen bg-[rgb(var(--page-bg))] font-sans">
      <TopBar user={session.user} />
      <OrcamentoDetalheClient orcamentoId={params.id} />
    </div>
  );
}
