import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGestor } from "@/lib/permissions";

async function checkAccess(session, osId) {
  const os = await prisma.ordemServico.findUnique({ where: { id: osId } });
  if (!os) return { os: null };
  const isGestorUser = isGestor(session.user.role);
  const isOwner = os.technicianId === session.user.id;
  return { os, allowed: isGestorUser || isOwner };
}

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { os, allowed } = await checkAccess(session, params.id);
  if (!os) return NextResponse.json({ error: "Ordem de serviço não encontrada" }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: "Sem acesso a esta OS" }, { status: 403 });

  const fotos = await prisma.fotoServico.findMany({
    where: { ordemServicoId: params.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(fotos);
}

// Recebe uma imagem já redimensionada pelo navegador (data URL base64).
// Sem upload de arquivo bruto/multipart para manter o endpoint simples.
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { os, allowed } = await checkAccess(session, params.id);
  if (!os) return NextResponse.json({ error: "Ordem de serviço não encontrada" }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: "Sem acesso a esta OS" }, { status: 403 });

  const body = await req.json();
  const data = body.data;
  if (!data || typeof data !== "string" || !data.startsWith("data:image/")) {
    return NextResponse.json({ error: "Imagem inválida" }, { status: 400 });
  }
  // Limite generoso (~3.5MB em base64) pra evitar que o SQLite infle demais.
  if (data.length > 5_000_000) {
    return NextResponse.json({ error: "Imagem muito grande" }, { status: 413 });
  }

  const foto = await prisma.fotoServico.create({
    data: { ordemServicoId: params.id, data },
  });

  return NextResponse.json(foto, { status: 201 });
}
