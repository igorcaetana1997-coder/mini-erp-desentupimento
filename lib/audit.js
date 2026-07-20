import { prisma } from "@/lib/prisma";

export async function registrarAuditoria({ session, action, entity, entityId, description }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: session.user.name,
        userRole: session.user.role,
        action,
        entity,
        entityId: entityId || null,
        description,
      },
    });
  } catch (err) {
    console.error("Falha ao registrar auditoria:", err);
  }
}
