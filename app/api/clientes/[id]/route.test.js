import { describe, it, expect, vi, beforeEach } from "vitest";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { GET, PATCH, DELETE } from "./route";

vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    cliente: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

function sessionAs(role) {
  return { user: { id: "u1", role, name: "Fulano", parceiroId: null } };
}

function makeReq(body) {
  return new Request("http://localhost/api/clientes/c1", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const params = { params: { id: "c1" } };

beforeEach(() => {
  vi.clearAllMocks();
  prisma.auditLog.create.mockResolvedValue({});
});

describe("GET /api/clientes/[id]", () => {
  it.each(["tecnico", "parceiro"])("403 pro papel %s", async (role) => {
    getServerSession.mockResolvedValue(sessionAs(role));
    const res = await GET(new Request("http://localhost"), params);
    expect(res.status).toBe(403);
  });

  it("200 pra gerente (isGestor, diferente da rota de gerentes)", async () => {
    getServerSession.mockResolvedValue(sessionAs("gerente"));
    prisma.cliente.findUnique.mockResolvedValue({ id: "c1", name: "Cliente X", ordens: [] });
    const res = await GET(new Request("http://localhost"), params);
    expect(res.status).toBe(200);
  });

  it("404 quando o cliente não existe", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.cliente.findUnique.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost"), params);
    expect(res.status).toBe(404);
  });

  it("regressão: busca as OS com where deletedAt: null (bug corrigido)", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.cliente.findUnique.mockResolvedValue({ id: "c1", name: "Cliente X", ordens: [] });
    await GET(new Request("http://localhost"), params);

    const chamada = prisma.cliente.findUnique.mock.calls[0][0];
    expect(chamada.include.ordens.where).toEqual({ deletedAt: null });
  });
});

describe("PATCH /api/clientes/[id]", () => {
  it("403 pra não-gestor", async () => {
    getServerSession.mockResolvedValue(sessionAs("tecnico"));
    const res = await PATCH(makeReq({ name: "Novo Nome" }), params);
    expect(res.status).toBe(403);
  });

  it("404 quando o cliente não existe", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.cliente.findUnique.mockResolvedValue(null);
    const res = await PATCH(makeReq({ name: "Novo Nome" }), params);
    expect(res.status).toBe(404);
  });

  it("400 quando o nome vem em branco", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.cliente.findUnique.mockResolvedValue({ id: "c1", name: "Antigo" });
    const res = await PATCH(makeReq({ name: "   " }), params);
    expect(res.status).toBe(400);
    expect(prisma.cliente.update).not.toHaveBeenCalled();
  });

  it("PATCH parcial só manda os campos alterados no update", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.cliente.findUnique.mockResolvedValue({ id: "c1", name: "Antigo", phone: "111" });
    prisma.cliente.update.mockResolvedValue({ id: "c1", name: "Antigo", phone: "222" });

    await PATCH(makeReq({ phone: "222" }), params);

    const chamada = prisma.cliente.update.mock.calls[0][0];
    expect(chamada.data).toEqual({ phone: "222" });
  });

  it("restaurar: true zera o deletedAt", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.cliente.findUnique.mockResolvedValue({ id: "c1", name: "Antigo", deletedAt: new Date() });
    prisma.cliente.update.mockResolvedValue({ id: "c1", name: "Antigo", deletedAt: null });

    await PATCH(makeReq({ restaurar: true }), params);

    const chamada = prisma.cliente.update.mock.calls[0][0];
    expect(chamada.data.deletedAt).toBeNull();
  });

  it("mudar um campo de endereço aparece na auditoria como 'o endereço'", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.cliente.findUnique.mockResolvedValue({ id: "c1", name: "Cliente X", cidade: "Antiga" });
    prisma.cliente.update.mockResolvedValue({ id: "c1", name: "Cliente X", cidade: "Nova" });

    await PATCH(makeReq({ cidade: "Nova" }), params);

    const auditoria = prisma.auditLog.create.mock.calls[0][0];
    expect(auditoria.data.description).toContain("o endereço");
  });
});

describe("DELETE /api/clientes/[id]", () => {
  it("403 pra não-gestor", async () => {
    getServerSession.mockResolvedValue(sessionAs("parceiro"));
    const res = await DELETE(new Request("http://localhost"), params);
    expect(res.status).toBe(403);
  });

  it("404 quando o cliente não existe", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.cliente.findUnique.mockResolvedValue(null);
    const res = await DELETE(new Request("http://localhost"), params);
    expect(res.status).toBe(404);
  });

  it("409 quando existem OS ativas vinculadas", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.cliente.findUnique.mockResolvedValue({ id: "c1", name: "X", deletedAt: null, _count: { ordens: 2 } });
    const res = await DELETE(new Request("http://localhost"), params);
    expect(res.status).toBe(409);
    expect(prisma.cliente.update).not.toHaveBeenCalled();
    expect(prisma.cliente.delete).not.toHaveBeenCalled();
  });

  it("primeira chamada (deletedAt nulo) faz soft delete", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.cliente.findUnique.mockResolvedValue({ id: "c1", name: "X", deletedAt: null, _count: { ordens: 0 } });
    const res = await DELETE(new Request("http://localhost"), params);
    const json = await res.json();

    expect(prisma.cliente.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { deletedAt: expect.any(Date) } })
    );
    expect(prisma.cliente.delete).not.toHaveBeenCalled();
    expect(json).toEqual({ ok: true, lixeira: true });
  });

  it("segunda chamada (deletedAt já preenchido) apaga de vez", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.cliente.findUnique.mockResolvedValue({ id: "c1", name: "X", deletedAt: new Date(), _count: { ordens: 0 } });
    const res = await DELETE(new Request("http://localhost"), params);
    const json = await res.json();

    expect(prisma.cliente.delete).toHaveBeenCalledWith({ where: { id: "c1" } });
    expect(json).toEqual({ ok: true });
  });
});
