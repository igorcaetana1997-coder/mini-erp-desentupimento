import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import TopBar from "@/components/TopBar";
import VisaoGeralClient from "./VisaoGeralClient";

export default async function VisaoGeralPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/tecnico");

  return (
    <div className="min-h-screen bg-[rgb(var(--page-bg))] font-sans">
      <TopBar user={session.user} />
      <VisaoGeralClient />
    </div>
  );
}
