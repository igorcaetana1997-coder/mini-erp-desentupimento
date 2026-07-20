import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/permissions";

// Log de auditoria — só o admin real visualiza, mesmo que as ações
// logadas sejam de um gerente.
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const entity = searchParams.get("entity");
  const userId = searchParams.get("userId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const take = Math.min(Number(searchParams.get("take")) || 100, 300);

  const where = {};
  if (entity) where.entity = entity;
  if (userId) where.userId = userId;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(`${from}T00:00:00`);
    if (to) where.createdAt.lte = new Date(`${to}T23:59:59`);
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
  });

  return NextResponse.json(logs);
}
