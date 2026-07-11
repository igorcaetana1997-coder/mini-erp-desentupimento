-- CreateTable
CREATE TABLE "Despesa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT,
    "valor" REAL NOT NULL,
    "data" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FotoServico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ordemServicoId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FotoServico_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FotoServico" ("createdAt", "data", "id", "ordemServicoId") SELECT "createdAt", "data", "id", "ordemServicoId" FROM "FotoServico";
DROP TABLE "FotoServico";
ALTER TABLE "new_FotoServico" RENAME TO "FotoServico";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
