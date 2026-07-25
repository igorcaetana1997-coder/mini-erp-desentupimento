import { describe, it, expect, vi, beforeEach } from "vitest";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "./route";

vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  },
}));

function sessionAs(role) {
  return { user: { id: "u1", role, name: "Fulano", parceiroId: null } };
}

function makeReq(body) {
  return new Request("http://localhost/api/gerentes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  prisma.auditLog.create.mockResolvedValue({});
  prisma.user.findUnique.mockResolvedValue(null);
});

describe("GET /api/gerentes", () => {
  it("403 sem sessão", async () => {
    getServerSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it.each(["tecnico", "parceiro", "gerente"])("403 pro papel %s (gerente não gerencia gerente)", async (role) => {
    getServerSession.mockResolvedValue(sessionAs(role));
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("200 pra admin, com os argumentos certos pro Prisma", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.user.findMany.mockResolvedValue([{ id: "g1", name: "Gerente X" }]);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: "gerente" } })
    );
  });
});

describe("POST /api/gerentes", () => {
  it.each(["tecnico", "parceiro", "gerente"])("403 pro papel %s, sem chamar create", async (role) => {
    getServerSession.mockResolvedValue(sessionAs(role));
    const res = await POST(makeReq({ name: "X", email: "x@x.com", password: "123456" }));
    expect(res.status).toBe(403);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("400 quando falta nome/email/senha", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    const res = await POST(makeReq({ name: "", email: "x@x.com", password: "123456" }));
    expect(res.status).toBe(400);
  });

  it("400 quando a senha tem menos de 6 caracteres", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    const res = await POST(makeReq({ name: "X", email: "x@x.com", password: "123" }));
    expect(res.status).toBe(400);
  });

  it("400 quando o username tem caracteres inválidos", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    const res = await POST(
      makeReq({ name: "X", email: "x@x.com", password: "123456", username: "usuário com espaço" })
    );
    expect(res.status).toBe(400);
  });

  it("409 quando o e-mail já está em uso", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.user.findUnique.mockResolvedValueOnce({ id: "existente" });
    const res = await POST(makeReq({ name: "X", email: "existe@x.com", password: "123456" }));
    expect(res.status).toBe(409);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("409 quando o username já está em uso", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.user.findUnique
      .mockResolvedValueOnce(null) // checagem de e-mail passa
      .mockResolvedValueOnce({ id: "existente" }); // checagem de username falha
    const res = await POST(makeReq({ name: "X", email: "x@x.com", password: "123456", username: "jasilva" }));
    expect(res.status).toBe(409);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("201 pra admin com dados válidos, senha não fica em texto puro, role fixo em gerente", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.user.create.mockImplementation(({ data }) => ({
      id: "novo",
      name: data.name,
      email: data.email,
      username: data.username,
      phone: data.phone,
    }));

    const res = await POST(makeReq({ name: "Novo Gerente", email: "novo@x.com", password: "senha123" }));
    expect(res.status).toBe(201);

    const chamada = prisma.user.create.mock.calls[0][0];
    expect(chamada.data.role).toBe("gerente");
    expect(chamada.data.password).not.toBe("senha123");
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });
});
