-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NumeroAutorizado" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" TEXT NOT NULL,
    "nome" TEXT,
    "lid" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "conexaoId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NumeroAutorizado_conexaoId_fkey" FOREIGN KEY ("conexaoId") REFERENCES "Conexao" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_NumeroAutorizado" ("ativo", "criadoEm", "id", "lid", "nome", "numero") SELECT "ativo", "criadoEm", "id", "lid", "nome", "numero" FROM "NumeroAutorizado";
DROP TABLE "NumeroAutorizado";
ALTER TABLE "new_NumeroAutorizado" RENAME TO "NumeroAutorizado";
CREATE UNIQUE INDEX "NumeroAutorizado_numero_key" ON "NumeroAutorizado"("numero");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
