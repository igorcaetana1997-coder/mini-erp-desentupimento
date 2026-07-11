-- Login de parceiro: aponta pra qual Parceiro aquele usuário representa
ALTER TABLE "User" ADD COLUMN "parceiroId" TEXT REFERENCES "Parceiro" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Pagamento parcial: valor efetivamente recebido até agora.
-- paymentStatus continua na tabela por compatibilidade, mas deixa de ser usado pelo app —
-- pago/parcial/pendente passa a ser calculado a partir de valorPago (lib/paymentStatus.js).
ALTER TABLE "OrdemServico" ADD COLUMN "valorPago" REAL NOT NULL DEFAULT 0;

-- Backfill: preserva o estado atual (OS já marcadas "pago" continuam contando como pagas).
UPDATE "OrdemServico" SET "valorPago" = "value" WHERE "paymentStatus" = 'pago' AND "value" IS NOT NULL;
