-- CreateTable
CREATE TABLE "Conexao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Conversa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" TEXT NOT NULL,
    "fluxoId" INTEGER,
    "nodeAtual" TEXT,
    "conexaoId" INTEGER,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Conversa_conexaoId_fkey" FOREIGN KEY ("conexaoId") REFERENCES "Conexao" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Conversa" ("atualizadoEm", "fluxoId", "id", "nodeAtual", "numero") SELECT "atualizadoEm", "fluxoId", "id", "nodeAtual", "numero" FROM "Conversa";
DROP TABLE "Conversa";
ALTER TABLE "new_Conversa" RENAME TO "Conversa";
CREATE UNIQUE INDEX "Conversa_numero_conexaoId_key" ON "Conversa"("numero", "conexaoId");
CREATE TABLE "new_Fluxo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "gatilhos" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "horarioInicio" TEXT,
    "horarioFim" TEXT,
    "msgForaHorario" TEXT,
    "mapa" TEXT NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
    "conexaoId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Fluxo_conexaoId_fkey" FOREIGN KEY ("conexaoId") REFERENCES "Conexao" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Fluxo" ("ativo", "atualizadoEm", "criadoEm", "gatilhos", "horarioFim", "horarioInicio", "id", "mapa", "msgForaHorario", "nome") SELECT "ativo", "atualizadoEm", "criadoEm", "gatilhos", "horarioFim", "horarioInicio", "id", "mapa", "msgForaHorario", "nome" FROM "Fluxo";
DROP TABLE "Fluxo";
ALTER TABLE "new_Fluxo" RENAME TO "Fluxo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
