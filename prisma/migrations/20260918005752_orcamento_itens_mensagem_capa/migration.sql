-- AlterTable
ALTER TABLE "Orcamento" ADD COLUMN     "mensagemCapa" TEXT;

-- CreateTable
CREATE TABLE "OrcamentoItem" (
    "id" TEXT NOT NULL,
    "orcamentoId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "valorUnitario" DOUBLE PRECISION NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrcamentoItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrcamentoItem_orcamentoId_idx" ON "OrcamentoItem"("orcamentoId");

-- AddForeignKey
ALTER TABLE "OrcamentoItem" ADD CONSTRAINT "OrcamentoItem_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "Orcamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
