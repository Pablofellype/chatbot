-- CreateTable
CREATE TABLE "MensagemAutomatica" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'texto',
    "mediaUrl" TEXT,
    "grupoId" TEXT NOT NULL,
    "grupoNome" TEXT NOT NULL,
    "conexaoId" INTEGER NOT NULL,
    "frequencia" TEXT NOT NULL DEFAULT 'diario',
    "diasSemana" TEXT,
    "horario" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoEnvio" DATETIME,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "MensagemAutomatica_conexaoId_fkey" FOREIGN KEY ("conexaoId") REFERENCES "Conexao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
