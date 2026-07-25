import { describe, it, expect, vi, beforeEach } from "vitest";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { PATCH, DELETE } from "./route";

vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    ordemServico: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    user: { findUnique: vi.fn() },
    parceiro: { findUnique: vi.fn() },
    fotoServico: { deleteMany: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

function sessionAs(role, extra = {}) {
  return { user: { id: "u1", role, name: "Fulano", parceiroId: null, ...extra } };
}

function makeReq(body) {
  return new Request("http://localhost/api/ordens/os1", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const params = { params: { id: "os1" } };

function osBase(overrides = {}) {
  return {
    id: "os1",
    status: "aberta",
    value: 300,
    valorPago: 0,
    technicianId: "tec1",
    parceiroId: null,
    parceriaTipo: null,
    parceriaPercentual: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  prisma.auditLog.create.mockResolvedValue({});
  prisma.ordemServico.update.mockImplementation(({ data }) => ({
    id: "os1",
    cliente: { name: "Cliente X" },
    ...data,
  }));
});

describe("PATCH /api/ordens/[id] — acesso", () => {
  it("401 sem sessão", async () => {
    getServerSession.mockResolvedValue(null);
    const res = await PATCH(makeReq({}), params);
    expect(res.status).toBe(401);
  });

  it("404 quando a OS não existe", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.ordemServico.findUnique.mockResolvedValue(null);
    const res = await PATCH(makeReq({}), params);
    expect(res.status).toBe(404);
  });

  it("403 pra técnico que não é o dono", async () => {
    getServerSession.mockResolvedValue(sessionAs("tecnico", { id: "outro-tec" }));
    prisma.ordemServico.findUnique.mockResolvedValue(osBase());
    const res = await PATCH(makeReq({ materiais: "cano" }), params);
    expect(res.status).toBe(403);
  });

  it("403 pra parceiro que não é o dono", async () => {
    getServerSession.mockResolvedValue(sessionAs("parceiro", { parceiroId: "outro-parc" }));
    prisma.ordemServico.findUnique.mockResolvedValue(osBase({ parceiroId: "p1" }));
    const res = await PATCH(makeReq({ value: 100 }), params);
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/ordens/[id] — admin/gerente", () => {
  it.each(["admin", "gerente"])("%s consegue editar valor e valorPago juntos", async (role) => {
    getServerSession.mockResolvedValue(sessionAs(role));
    prisma.ordemServico.findUnique.mockResolvedValue(osBase());
    const res = await PATCH(makeReq({ value: 400, valorPago: 200 }), params);
    expect(res.status).toBe(200);
    const chamada = prisma.ordemServico.update.mock.calls[0][0];
    expect(chamada.data.value).toBe(400);
    expect(chamada.data.valorPago).toBe(200);
  });

  it("400 quando technicianId aponta pra usuário que não é técnico", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.ordemServico.findUnique.mockResolvedValue(osBase());
    prisma.user.findUnique.mockResolvedValue({ id: "x", role: "parceiro" });
    const res = await PATCH(makeReq({ technicianId: "x" }), params);
    expect(res.status).toBe(400);
  });

  it("400 quando valorPago é maior que o valor final da OS", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.ordemServico.findUnique.mockResolvedValue(osBase({ value: 300 }));
    const res = await PATCH(makeReq({ valorPago: 999 }), params);
    expect(res.status).toBe(400);
  });

  it("400 numa transição de status que não é recusada->aberta", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.ordemServico.findUnique.mockResolvedValue(osBase({ status: "aberta" }));
    const res = await PATCH(makeReq({ status: "concluida" }), params);
    expect(res.status).toBe(400);
  });

  it("200 reabrindo uma OS recusada", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.ordemServico.findUnique.mockResolvedValue(osBase({ status: "recusada" }));
    const res = await PATCH(makeReq({ status: "aberta" }), params);
    expect(res.status).toBe(200);
    const chamada = prisma.ordemServico.update.mock.calls[0][0];
    expect(chamada.data.status).toBe("aberta");
    expect(chamada.data.motivoRecusa).toBeNull();
  });

  it("400 quando parceriaTipo é inválido ao atribuir parceiro", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.ordemServico.findUnique.mockResolvedValue(osBase());
    prisma.parceiro.findUnique.mockResolvedValue({ id: "p1", name: "Parceiro X" });
    const res = await PATCH(makeReq({ parceiroId: "p1", parceriaTipo: "invalido", parceriaPercentual: 10 }), params);
    expect(res.status).toBe(400);
  });

  it("400 quando parceriaPercentual está fora de 0-100", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.ordemServico.findUnique.mockResolvedValue(osBase());
    prisma.parceiro.findUnique.mockResolvedValue({ id: "p1", name: "Parceiro X" });
    const res = await PATCH(
      makeReq({ parceiroId: "p1", parceriaTipo: "repassado", parceriaPercentual: 150 }),
      params
    );
    expect(res.status).toBe(400);
  });

  it("404 quando o parceiro atribuído não existe", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.ordemServico.findUnique.mockResolvedValue(osBase());
    prisma.parceiro.findUnique.mockResolvedValue(null);
    const res = await PATCH(makeReq({ parceiroId: "inexistente", parceriaTipo: "repassado", parceriaPercentual: 10 }), params);
    expect(res.status).toBe(404);
  });

  it("reatribuir o técnico aparece mencionado na auditoria", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.ordemServico.findUnique.mockResolvedValue(osBase());
    prisma.user.findUnique.mockResolvedValue({ id: "tec2", role: "tecnico" });
    await PATCH(makeReq({ technicianId: "tec2" }), params);
    const auditoria = prisma.auditLog.create.mock.calls[0][0];
    expect(auditoria.data.description).toContain("o técnico responsável");
  });
});

describe("PATCH /api/ordens/[id] — técnico dono", () => {
  it("edita materiais e avaliação", async () => {
    getServerSession.mockResolvedValue(sessionAs("tecnico", { id: "tec1" }));
    prisma.ordemServico.findUnique.mockResolvedValue(osBase({ technicianId: "tec1" }));
    const res = await PATCH(makeReq({ materiais: "cano novo", avaliacaoNota: 5 }), params);
    expect(res.status).toBe(200);
    const chamada = prisma.ordemServico.update.mock.calls[0][0];
    expect(chamada.data.materiais).toBe("cano novo");
    expect(chamada.data.avaliacaoNota).toBe(5);
  });

  it("400 quando avaliacaoNota está fora de 1-5", async () => {
    getServerSession.mockResolvedValue(sessionAs("tecnico", { id: "tec1" }));
    prisma.ordemServico.findUnique.mockResolvedValue(osBase({ technicianId: "tec1" }));
    const res = await PATCH(makeReq({ avaliacaoNota: 9 }), params);
    expect(res.status).toBe(400);
  });

  it("edita o valor só enquanto aberta/andamento", async () => {
    getServerSession.mockResolvedValue(sessionAs("tecnico", { id: "tec1" }));
    prisma.ordemServico.findUnique.mockResolvedValue(osBase({ technicianId: "tec1", status: "concluida" }));
    const res = await PATCH(makeReq({ value: 500 }), params);
    expect(res.status).toBe(400);
  });

  it("campos fora do seu escopo (technicianId) são ignorados, não entram no update", async () => {
    getServerSession.mockResolvedValue(sessionAs("tecnico", { id: "tec1" }));
    prisma.ordemServico.findUnique.mockResolvedValue(osBase({ technicianId: "tec1" }));
    await PATCH(makeReq({ materiais: "x", technicianId: "outro-tecnico" }), params);
    const chamada = prisma.ordemServico.update.mock.calls[0][0];
    expect(chamada.data.technicianId).toBeUndefined();
  });
});

describe("PATCH /api/ordens/[id] — parceiro dono", () => {
  it("edita só o valor, enquanto aberta/andamento", async () => {
    getServerSession.mockResolvedValue(sessionAs("parceiro", { parceiroId: "p1" }));
    prisma.ordemServico.findUnique.mockResolvedValue(osBase({ technicianId: null, parceiroId: "p1", status: "andamento" }));
    const res = await PATCH(makeReq({ value: 250 }), params);
    expect(res.status).toBe(200);
    const chamada = prisma.ordemServico.update.mock.calls[0][0];
    expect(chamada.data.value).toBe(250);
  });

  it("400 'nenhum campo válido' quando manda só materiais (fora do escopo dele) sem value", async () => {
    getServerSession.mockResolvedValue(sessionAs("parceiro", { parceiroId: "p1" }));
    prisma.ordemServico.findUnique.mockResolvedValue(osBase({ technicianId: null, parceiroId: "p1" }));
    const res = await PATCH(makeReq({ materiais: "não devia poder" }), params);
    expect(res.status).toBe(400);
    expect(prisma.ordemServico.update).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/ordens/[id]", () => {
  it("403 pra não-gestor", async () => {
    getServerSession.mockResolvedValue(sessionAs("tecnico"));
    const res = await DELETE(new Request("http://localhost"), params);
    expect(res.status).toBe(403);
  });

  it("primeira chamada move pra lixeira", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.ordemServico.findUnique.mockResolvedValue({ id: "os1", deletedAt: null, cliente: { name: "X" } });
    const res = await DELETE(new Request("http://localhost"), params);
    const json = await res.json();
    expect(json).toEqual({ ok: true, lixeira: true });
    expect(prisma.ordemServico.delete).not.toHaveBeenCalled();
  });

  it("segunda chamada apaga de vez e remove as fotos antes", async () => {
    getServerSession.mockResolvedValue(sessionAs("admin"));
    prisma.ordemServico.findUnique.mockResolvedValue({ id: "os1", deletedAt: new Date(), cliente: { name: "X" } });
    const res = await DELETE(new Request("http://localhost"), params);
    const json = await res.json();
    expect(prisma.fotoServico.deleteMany).toHaveBeenCalledWith({ where: { ordemServicoId: "os1" } });
    expect(prisma.ordemServico.delete).toHaveBeenCalledWith({ where: { id: "os1" } });
    expect(json).toEqual({ ok: true });
  });
});
