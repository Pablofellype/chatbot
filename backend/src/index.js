process.on('unhandledRejection', (reason, promise) => {
  console.error('[ERRO INTERNO/PROMISE] Rejeição não tratada detectada:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('[ERRO INTERNO/EXECUÇÃO] Exceção não tratada detectada:', error);
});

const express = require('express');
const path = require('path');
const cors = require('cors');
const { initAllConexoes, destruirTodas } = require('./services/whatsappService');
const { iniciarScheduler } = require('./services/scheduler');
const fluxoRoutes = require('./routes/fluxoRoutes');
const numeroRoutes = require('./routes/numeroRoutes');
const conexaoRoutes = require('./routes/conexaoRoutes');
const mensagemAutoRoutes = require('./routes/mensagemAutoRoutes');
const mensagemIndividualRoutes = require('./routes/mensagemIndividualRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middlewares/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/fluxos', authMiddleware, fluxoRoutes);
app.use('/api/numeros', authMiddleware, numeroRoutes);
app.use('/api/conexoes', authMiddleware, conexaoRoutes);
app.use('/api/mensagens-auto', authMiddleware, mensagemAutoRoutes);
app.use('/api/mensagens-individuais', authMiddleware, mensagemIndividualRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);

// Serve uploads estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve o frontend buildado (em produção)
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n[SERVIDOR] Rodando em http://localhost:${PORT}`);
  console.log('[SERVIDOR] Iniciando conexões WhatsApp...\n');
  initAllConexoes();
  iniciarScheduler();
});

// Fecha limpo quando nodemon reinicia (mata Chrome/Puppeteer)
const shutdown = async (signal) => {
  console.log(`\n[SERVIDOR] Encerrando (${signal})...`);
  await destruirTodas();
  server.close();
  process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.once('SIGUSR2', async () => {
  await destruirTodas();
  server.close();
  process.kill(process.pid, 'SIGUSR2');
});
