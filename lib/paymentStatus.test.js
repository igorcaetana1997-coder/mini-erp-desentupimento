import { describe, it, expect } from "vitest";
import { getStatusPagamento } from "@/lib/paymentStatus";

describe("getStatusPagamento", () => {
  it("value nulo/indefinido retorna status null, independente de valorPago", () => {
    expect(getStatusPagamento({ value: null, valorPago: 100 })).toEqual({ status: null, faltante: 0 });
    expect(getStatusPagamento({ value: undefined, valorPago: 0 })).toEqual({ status: null, faltante: 0 });
  });

  it("sem pagamento (valorPago ausente) é pendente, faltante igual ao value", () => {
    expect(getStatusPagamento({ value: 300 })).toEqual({ status: "pendente", faltante: 300 });
  });

  it("pago exatamente é pago, faltante zero", () => {
    expect(getStatusPagamento({ value: 300, valorPago: 300 })).toEqual({ status: "pago", faltante: 0 });
  });

  it("pago a maior ainda é pago, faltante grampeado em zero", () => {
    expect(getStatusPagamento({ value: 300, valorPago: 350 })).toEqual({ status: "pago", faltante: 0 });
  });

  it("pagamento parcial calcula o faltante exato", () => {
    expect(getStatusPagamento({ value: 300, valorPago: 120 })).toEqual({ status: "parcial", faltante: 180 });
  });

  it("value zero com valorPago zero é pendente, sem faltante", () => {
    expect(getStatusPagamento({ value: 0, valorPago: 0 })).toEqual({ status: "pendente", faltante: 0 });
  });
});
