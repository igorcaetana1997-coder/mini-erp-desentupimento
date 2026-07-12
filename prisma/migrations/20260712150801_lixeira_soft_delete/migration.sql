-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "OrdemServico" ADD COLUMN     "deletedAt" TIMESTAMP(3);
