import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        let user;
        try {
          user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase().trim() },
          });
        } catch (err) {
          console.error("[auth-debug] erro ao consultar o banco:", err?.message);
          throw err;
        }
        console.log(
          "[auth-debug] email:",
          credentials.email.toLowerCase().trim(),
          "| usuario encontrado:",
          !!user,
          "| DATABASE_URL host:",
          (process.env.DATABASE_URL || "").split("@")[1]?.split("/")[0]
        );
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        console.log("[auth-debug] senha valida:", valid);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          parceiroId: user.parceiroId,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.parceiroId = user.parceiroId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.parceiroId = token.parceiroId;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
