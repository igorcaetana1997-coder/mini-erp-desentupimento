import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import TopBar from "@/components/TopBar";
import PainelClient from "./PainelClient";

export default async function PainelPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/tecnico");

  return (
    <div className="min-h-screen bg-[rgb(var(--page-bg))] font-sans">
      <TopBar user={session.user} />
      <PainelClient />
    </div>
  );
}
