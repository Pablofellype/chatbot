-- CreateTable
CREATE TABLE "MensagemIndividual" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'texto',
    "mediaUrl" TEXT,
    "numeroId" INTEGER NOT NULL,
    "conexaoId" INTEGER NOT NULL,
    "frequencia" TEXT NOT NULL DEFAULT 'uma_vez',
    "diasSemana" TEXT,
    "horario" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoEnvio" DATETIME,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "MensagemIndividual_numeroId_fkey" FOREIGN KEY ("numeroId") REFERENCES "NumeroAutorizado" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MensagemIndividual_conexaoId_fkey" FOREIGN KEY ("conexaoId") REFERENCES "Conexao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
