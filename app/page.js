import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isGestor } from "@/lib/permissions";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (isGestor(session.user.role)) {
    redirect("/painel");
  }

  if (session.user.role === "parceiro") {
    redirect("/parceiro");
  }

  redirect("/tecnico");
}
