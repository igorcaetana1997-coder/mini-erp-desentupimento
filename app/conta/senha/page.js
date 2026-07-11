import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import TopBar from "@/components/TopBar";
import AlterarSenhaClient from "./AlterarSenhaClient";

export default async function AlterarSenhaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-[rgb(var(--page-bg))] font-sans">
      <TopBar user={session.user} />
      <AlterarSenhaClient />
    </div>
  );
}
