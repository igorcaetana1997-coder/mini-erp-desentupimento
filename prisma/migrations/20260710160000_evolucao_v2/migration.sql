-- Cliente: CEP e observações
ALTER TABLE "Cliente" ADD COLUMN "cep" TEXT;
ALTER TABLE "Cliente" ADD COLUMN "observacoes" TEXT;

-- OrdemServico: renomeia "date" (só data) para "scheduledAt" (data + hora da visita),
-- preservando os valores já gravados.
ALTER TABLE "OrdemServico" RENAME COLUMN "date" TO "scheduledAt";

-- OrdemServico: financeiro
ALTER TABLE "OrdemServico" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "OrdemServico" ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'pendente';
ALTER TABLE "OrdemServico" ADD COLUMN "dueDate" DATETIME;

-- OrdemServico: materiais, conclusão (assinatura/avaliação) e recusa
ALTER TABLE "OrdemServico" ADD COLUMN "materiais" TEXT;
ALTER TABLE "OrdemServico" ADD COLUMN "assinaturaCliente" TEXT;
ALTER TABLE "OrdemServico" ADD COLUMN "avaliacaoNota" INTEGER;
ALTER TABLE "OrdemServico" ADD COLUMN "motivoRecusa" TEXT;
ALTER TABLE "OrdemServico" ADD COLUMN "recusadaEm" DATETIME;

-- Fotos do serviço
CREATE TABLE "FotoServico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ordemServicoId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FotoServico_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
