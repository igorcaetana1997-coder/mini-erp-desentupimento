import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect(session.user.role === "admin" ? "/painel" : "/tecnico");
  }

  return (
    <div className="min-h-screen bg-[#142D65] flex items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
