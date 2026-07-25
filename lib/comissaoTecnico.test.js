import { describe, it, expect } from "vitest";
import { calcularFaixa } from "@/lib/comissaoTecnico";

describe("calcularFaixa", () => {
  it("retorna null pra array vazio, null ou undefined", () => {
    expect(calcularFaixa([], 1000)).toBeNull();
    expect(calcularFaixa(null, 1000)).toBeNull();
    expect(calcularFaixa(undefined, 1000)).toBeNull();
  });

  it("retorna null quando o total está abaixo de todas as faixas", () => {
    const faixas = [{ minValor: 1000, percentual: 5 }, { minValor: 2000, percentual: 10 }];
    expect(calcularFaixa(faixas, 500)).toBeNull();
  });

  it("o limite é inclusive (<=)", () => {
    const faixas = [{ minValor: 1000, percentual: 5 }];
    expect(calcularFaixa(faixas, 1000)?.percentual).toBe(5);
  });

  it("escolhe a faixa de maior minValor elegível, independente da ordem do array", () => {
    const faixas = [
      { minValor: 2000, percentual: 10 },
      { minValor: 0, percentual: 2 },
      { minValor: 1000, percentual: 5 },
    ];
    expect(calcularFaixa(faixas, 2500)?.percentual).toBe(10);
    expect(calcularFaixa(faixas, 1500)?.percentual).toBe(5);
    expect(calcularFaixa(faixas, 500)?.percentual).toBe(2);
  });

  it("em empate de minValor, a primeira encontrada na iteração vence (comportamento documentado)", () => {
    const faixas = [
      { minValor: 1000, percentual: 5 },
      { minValor: 1000, percentual: 7 },
    ];
    expect(calcularFaixa(faixas, 1000)?.percentual).toBe(5);
  });
});
