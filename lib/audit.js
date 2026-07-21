import { prisma } from "@/lib/prisma";

// Compara campos de "antes"/"depois" e monta uma lista de frases tipo
// "valor de R$ 300,00 para R$ 350,00", só para os campos presentes em
// `novo` que realmente mudaram. `campos` é { chave: { label, format? } }.
export function descreverAlteracoes(anterior, novo, campos) {
  const partes = [];
  for (const [campo, cfg] of Object.entries(campos)) {
    if (novo[campo] === undefined) continue;
    const valorAntigo = anterior[campo] ?? null;
    const valorNovo = novo[campo] ?? null;
    if (valorAntigo === valorNovo) continue;
    const format = cfg.format || ((v) => (v === null ? "—" : String(v)));
    partes.push(`${cfg.label} de ${format(valorAntigo)} para ${format(valorNovo)}`);
  }
  return partes;
}

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
