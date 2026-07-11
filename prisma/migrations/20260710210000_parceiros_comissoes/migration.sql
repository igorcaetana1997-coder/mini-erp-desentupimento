-- Parceiros/terceirizados: cadastro para acompanhar comissões pagas/recebidas
CREATE TABLE "Parceiro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "documento" TEXT,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Faixas de comissão do técnico próprio, por faturamento mensal
CREATE TABLE "FaixaComissao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "minValor" REAL NOT NULL,
    "percentual" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- OrdemServico: campos de parceria/terceirização
ALTER TABLE "OrdemServico" ADD COLUMN "parceiroId" TEXT REFERENCES "Parceiro" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrdemServico" ADD COLUMN "parceriaTipo" TEXT;
ALTER TABLE "OrdemServico" ADD COLUMN "parceriaPercentual" REAL;
