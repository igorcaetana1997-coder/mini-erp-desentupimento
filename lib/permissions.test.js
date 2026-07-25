import { describe, it, expect } from "vitest";
import { isAdmin, isGestor, roleLabel } from "@/lib/permissions";

describe("isAdmin", () => {
  it("é true só para admin", () => {
    expect(isAdmin("admin")).toBe(true);
  });

  it("é false pros demais papéis", () => {
    expect(isAdmin("gerente")).toBe(false);
    expect(isAdmin("tecnico")).toBe(false);
    expect(isAdmin("parceiro")).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });
});

describe("isGestor", () => {
  it("é true pra admin e gerente", () => {
    expect(isGestor("admin")).toBe(true);
    expect(isGestor("gerente")).toBe(true);
  });

  it("é false pra técnico, parceiro e indefinido", () => {
    expect(isGestor("tecnico")).toBe(false);
    expect(isGestor("parceiro")).toBe(false);
    expect(isGestor(undefined)).toBe(false);
  });
});

describe("roleLabel", () => {
  it("mapeia os papéis conhecidos", () => {
    expect(roleLabel("admin")).toBe("Admin");
    expect(roleLabel("gerente")).toBe("Gerente");
    expect(roleLabel("tecnico")).toBe("Técnico");
    expect(roleLabel("parceiro")).toBe("Parceiro");
  });

  it("faz fallback pro valor recebido quando o papel é desconhecido", () => {
    expect(roleLabel("desconhecido")).toBe("desconhecido");
  });
});
