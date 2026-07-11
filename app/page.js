import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "admin") {
    redirect("/painel");
  }

  if (session.user.role === "parceiro") {
    redirect("/parceiro");
  }

  redirect("/tecnico");
}
