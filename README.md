# Bot WhatsApp — Sistema de Atendimento Automatizado

Sistema completo de chatbot WhatsApp com painel administrativo, fluxos visuais, agendamento de mensagens e suporte a multiplas conexoes (departamentos).

---

## 📖 Glossário & Exemplos de Fluxos

Para facilitar a compreensão do ecossistema técnico e ajudar no início rápido da criação de robôs, disponibilizamos os seguintes guias:

- **[Glossário Interativo em HTML (Recomendado)](glossario.html)** — Abra o `glossario.html` no seu navegador para ter uma experiência com busca instantânea, abas filtradas e design responsivo.
- **[Glossário Técnico (Markdown)](GLOSSARIO.md)** — Explicação estática direta sobre conceitos e ferramentas.
- **[Exemplos de Fluxos de Atendimento (Markdown)](EXEMPLOS_FLUXO.md)** — Roteiros visuais completos (com diagramas Mermaid e configurações recomendadas) para os setores **Administrativo** e de **Planejamento**.

---

## Requisitos

- **Node.js** 18 ou superior (recomendado: 20+)
- **npm** (vem com Node.js)
- **Google Chrome** instalado (o whatsapp-web.js usa Chromium por baixo)
- **ffmpeg** (opcional, para converter audios)

### Windows
1. Baixe e instale o Node.js: https://nodejs.org (versao LTS)
2. O Chrome ja deve estar instalado
3. ffmpeg (opcional): https://ffmpeg.org/download.html

### Mac
1. `brew install node` ou baixe em https://nodejs.org
2. `brew install ffmpeg` (opcional)

### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs chromium-browser
sudo apt install -y ffmpeg  # opcional
```

---

## Instalacao (Passo a Passo)

### 1. Clonar o repositorio

```bash
git clone https://github.com/SEU_USUARIO/chatbot.git
cd chatbot
```

### 2. Instalar dependencias do BACKEND

```bash
cd backend
npm install
```

### 3. Gerar o cliente Prisma e criar o banco de dados

```bash
npx prisma generate
npx prisma migrate dev --name init
```

> Isso cria o arquivo `prisma/dev.db` (banco SQLite local). Nao precisa instalar nenhum banco externo.

### 4. Criar o arquivo .env do backend

Crie o arquivo `backend/.env` com:

```
DATABASE_URL="file:./dev.db"
PORT=3001
```

### 5. Criar pasta de uploads

```bash
mkdir uploads
```

> No Windows: crie a pasta `uploads` dentro de `backend` manualmente.

### 6. Instalar dependencias do FRONTEND

```bash
cd ../frontend
npm install
```

### 7. Voltar para a raiz

```bash
cd ..
```

---

## Rodando o Sistema

Voce precisa de **2 terminais abertos** ao mesmo tempo:

### Terminal 1 — Backend

```bash
cd backend
npm run dev
```

Aguarde ate aparecer:
```
[SERVIDOR] Rodando em http://localhost:3001
[WHATSAPP] Inicializando...
```

> A primeira vez pode demorar 30-60 segundos para o WhatsApp conectar.

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

Vai aparecer:
```
Local: http://localhost:5173/
```

### 8. Acessar o painel

Abra o navegador em: **http://localhost:5173**

---

## Primeiro Uso

1. Va em **Conexoes** no menu lateral
2. Digite o nome do setor (ex: "Administrativo") e clique **+ Adicionar**
3. Um QR Code vai aparecer — escaneie com o WhatsApp do celular
4. Quando conectar, va em **Numeros** e adicione os numeros autorizados a conversar com o bot
5. Va em **Fluxos**, crie um fluxo, vincule ao numero conectado e monte o fluxo visual
6. Teste enviando uma mensagem para o WhatsApp conectado

---

## Estrutura do Projeto

```
chatbot/
├── backend/
│   ├── src/
│   │   ├── index.js              # Servidor Express
│   │   ├── controllers/          # Logica das rotas
│   │   ├── routes/               # Rotas da API
│   │   ├── services/
│   │   │   ├── whatsappService.js # Bot WhatsApp
│   │   │   └── scheduler.js       # Agendador de mensagens
│   │   └── database/
│   │       └── prisma.js          # Cliente Prisma
│   ├── prisma/
│   │   └── schema.prisma          # Schema do banco
│   ├── uploads/                   # Audios/midias enviadas
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Layout principal + pagina Fluxos
│   │   ├── components/
│   │   │   ├── FlowCanvas.jsx     # Editor visual de fluxos
│   │   │   ├── NodeEditPanel.jsx   # Painel de edicao dos nodes
│   │   │   ├── ConexaoPage.jsx     # Gerenciar conexoes WhatsApp
│   │   │   ├── NumerosPage.jsx     # Numeros autorizados
│   │   │   └── MensagensIndividuaisPage.jsx # Agendamentos
│   │   ├── services/
│   │   │   └── api.js             # Chamadas HTTP
│   │   └── index.css              # Design system (tokens CSS)
│   └── package.json
└── package.json                    # Scripts da raiz
```

---

## API Endpoints

| Rota | Metodo | Descricao |
|------|--------|-----------|
| `/api/fluxos` | GET/POST | Listar/criar fluxos |
| `/api/fluxos/:id` | GET/PUT/DELETE | Obter/editar/deletar fluxo |
| `/api/fluxos/:id/duplicar` | POST | Duplicar fluxo |
| `/api/conexoes` | GET/POST | Listar/criar conexoes |
| `/api/conexoes/:id` | PUT/DELETE | Editar/deletar conexao |
| `/api/conexoes/:id/status` | GET | Status da conexao |
| `/api/conexoes/:id/logout` | POST | Desconectar WhatsApp |
| `/api/conexoes/:id/reconectar` | POST | Reconectar WhatsApp |
| `/api/numeros` | GET/POST | Listar/criar numeros autorizados |
| `/api/numeros/:id` | PUT/DELETE | Editar/deletar numero |
| `/api/mensagens-individuais` | GET/POST | Agendamentos individuais |
| `/api/mensagens-individuais/:id` | PUT/DELETE | Editar/deletar agendamento |
| `/api/mensagens-individuais/:id/enviar` | POST | Enviar agora |
| `/api/mensagens-auto` | GET/POST | Mensagens automaticas (grupos) |
| `/api/upload/audio` | POST | Upload de audio |

---

## Solucao de Problemas

### Erro: EADDRINUSE (porta ja em uso)
```bash
# Mac/Linux
lsof -ti:3001 | xargs kill -9

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process -Force
```

### Erro: Chromium nao encontrado
```bash
npx puppeteer install
```

### Erro: The browser is already running
Mate todos os processos do Chrome/Chromium e delete o lock:
```bash
# Mac/Linux
pkill -9 -f chromium

# Windows (PowerShell)
Get-Process chrome, chromium -ErrorAction SilentlyContinue | Stop-Process -Force
```
Depois delete o arquivo `backend/.wwebjs_auth/session-conexao_*/SingletonLock` se existir.

### WhatsApp demora para conectar
Normal — pode levar 30-60 segundos na primeira vez. Se travar por mais de 2 minutos, clique "Reconectar" no painel.

### Banco nao existe / tabelas nao encontradas
```bash
cd backend
npx prisma migrate dev
```

### Frontend nao conecta no backend
Certifique-se que o backend esta rodando na porta 3001. O frontend em dev mode usa proxy automatico.

---

## Producao

Para rodar em producao (VPS), veja o arquivo `DEPLOY.md`.

Resumo rapido:
```bash
cd frontend && npm run build && cd ..
cd backend && node src/index.js
```
O backend serve o frontend buildado automaticamente em `http://localhost:3001`.

---

## Tecnologias

- **Backend**: Node.js, Express, whatsapp-web.js, Prisma ORM, SQLite
- **Frontend**: React 19, Vite, Tailwind CSS v4, React Flow (@xyflow/react)
- **Banco**: SQLite (sem necessidade de instalar banco externo)
