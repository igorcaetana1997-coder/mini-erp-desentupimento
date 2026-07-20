import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isGestor } from "@/lib/permissions";
import TopBar from "@/components/TopBar";
import FinanceiroClient from "./FinanceiroClient";

export default async function FinanceiroPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!isGestor(session.user.role)) redirect("/tecnico");

  return (
    <div className="min-h-screen bg-[rgb(var(--page-bg))] font-sans">
      <TopBar user={session.user} />
      <FinanceiroClient />
    </div>
  );
}
