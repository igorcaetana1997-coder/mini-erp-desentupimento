-- CreateTable
CREATE TABLE "Orcamento" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "validoAte" TIMESTAMP(3),
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "ordemServicoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Orcamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Orcamento_ordemServicoId_key" ON "Orcamento"("ordemServicoId");

-- AddForeignKey
ALTER TABLE "Orcamento" ADD CONSTRAINT "Orcamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orcamento" ADD CONSTRAINT "Orcamento_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id") ON DELETE SET NULL ON UPDATE CASCADE;
