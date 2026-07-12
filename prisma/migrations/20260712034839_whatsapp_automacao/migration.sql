-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "ultimoParabensAno" INTEGER;

-- AlterTable
ALTER TABLE "OrdemServico" ADD COLUMN     "concluidaEm" TIMESTAMP(3),
ADD COLUMN     "followUpEnviadoEm" TIMESTAMP(3);
