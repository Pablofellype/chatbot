-- CreateTable
CREATE TABLE "Fluxo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "gatilhos" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "horarioInicio" TEXT,
    "horarioFim" TEXT,
    "msgForaHorario" TEXT,
    "mapa" TEXT NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Conversa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" TEXT NOT NULL,
    "fluxoId" INTEGER,
    "nodeAtual" TEXT,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversa_numero_key" ON "Conversa"("numero");
