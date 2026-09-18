-- AlterTable
ALTER TABLE "Orcamento" ADD COLUMN "numeroSequencial" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Orcamento_numeroSequencial_key" ON "Orcamento"("numeroSequencial");
