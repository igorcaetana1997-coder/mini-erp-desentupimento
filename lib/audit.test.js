import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { descreverAlteracoes, registrarAuditoria } from "@/lib/audit";

vi.mock("@/lib/prisma", () => ({
  prisma: { auditLog: { create: vi.fn() } },
}));

describe("descreverAlteracoes", () => {
  it("ignora campo ausente em novo", () => {
    const partes = descreverAlteracoes({ valor: 100 }, {}, { valor: { label: "o valor" } });
    expect(partes).toEqual([]);
  });

  it("ignora campo presente mas sem mudança", () => {
    const partes = descreverAlteracoes({ valor: 100 }, { valor: 100 }, { valor: { label: "o valor" } });
    expect(partes).toEqual([]);
  });

  it("gera frase padrão sem format, usando — pra null", () => {
    const partes = descreverAlteracoes({ descricao: null }, { descricao: "Nova" }, { descricao: { label: "a descrição" } });
    expect(partes).toEqual(["a descrição de — para Nova"]);
  });

  it("usa o format customizado dos dois lados", () => {
    const partes = descreverAlteracoes(
      { valor: 100 },
      { valor: 200 },
      { valor: { label: "o valor", format: (v) => `R$ ${v}` } }
    );
    expect(partes).toEqual(["o valor de R$ 100 para R$ 200"]);
  });

  it("trata anterior[campo] ausente como null", () => {
    const partes = descreverAlteracoes({}, { vencimento: "2026-01-01" }, { vencimento: { label: "o vencimento", format: (v) => (v ? v : "sem vencimento") } });
    expect(partes).toEqual(["o vencimento de sem vencimento para 2026-01-01"]);
  });

  it("gera uma frase por campo alterado, na ordem declarada", () => {
    const partes = descreverAlteracoes(
      { name: "A", phone: "111" },
      { name: "B", phone: "222" },
      { name: { label: "o nome" }, phone: { label: "o telefone" } }
    );
    expect(partes).toEqual(["o nome de A para B", "o telefone de 111 para 222"]);
  });
});

describe("registrarAuditoria", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("chama prisma.auditLog.create com os dados da sessão", async () => {
    prisma.auditLog.create.mockResolvedValue({});
    const session = { user: { id: "u1", name: "Fulano", role: "admin" } };
    await registrarAuditoria({
      session,
      action: "update",
      entity: "Cliente",
      entityId: "c1",
      description: "Fulano editou o cliente X",
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: "u1",
        userName: "Fulano",
        userRole: "admin",
        action: "update",
        entity: "Cliente",
        entityId: "c1",
        description: "Fulano editou o cliente X",
      },
    });
  });

  it("não lança erro quando prisma.auditLog.create falha (try/catch engolindo)", async () => {
    prisma.auditLog.create.mockRejectedValue(new Error("banco fora do ar"));
    const session = { user: { id: "u1", name: "Fulano", role: "admin" } };
    await expect(
      registrarAuditoria({ session, action: "update", entity: "Cliente", entityId: "c1", description: "x" })
    ).resolves.toBeUndefined();
  });
});
