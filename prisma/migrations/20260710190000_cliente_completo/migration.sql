-- Cliente: endereço estruturado (renomeia "address" para "logradouro",
-- preservando os valores já cadastrados) + novos campos.
ALTER TABLE "Cliente" RENAME COLUMN "address" TO "logradouro";

ALTER TABLE "Cliente" ADD COLUMN "email" TEXT;
ALTER TABLE "Cliente" ADD COLUMN "documento" TEXT;
ALTER TABLE "Cliente" ADD COLUMN "dataNascimento" DATETIME;
ALTER TABLE "Cliente" ADD COLUMN "numero" TEXT;
ALTER TABLE "Cliente" ADD COLUMN "complemento" TEXT;
ALTER TABLE "Cliente" ADD COLUMN "bairro" TEXT;
ALTER TABLE "Cliente" ADD COLUMN "cidade" TEXT;
ALTER TABLE "Cliente" ADD COLUMN "uf" TEXT;
