const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const prisma = require('../database/prisma');

// Map de conexões ativas: conexaoId -> { client, status, qrCode }
const conexoes = new Map();

// --- Helpers do grafo ---
function parseMapa(fluxo) {
  try { return JSON.parse(fluxo.mapa); } catch { return { nodes: [], edges: [] }; }
}
function findNode(mapa, id) { return mapa.nodes.find((n) => n.id === id); }
function findNextNodes(mapa, nodeId, handle) {
  return mapa.edges
    .filter((e) => e.source === nodeId && (!handle || e.sourceHandle === handle))
    .map((e) => findNode(mapa, e.target)).filter(Boolean);
}
function findStartNode(mapa) { return mapa.nodes.find((n) => n.type === 'startNode'); }

// --- Filtro de números (lê do banco) ---
function extrairNumero(chatId) { return chatId.replace(/@.*$/, ''); }

// Compara números: exato, endsWith, ou últimos 8 dígitos (resolve 9o dígito BR)
function numerosCorrespondem(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 8 && b.length >= 8) {
    if (a.endsWith(b) || b.endsWith(a)) return true;
    if (a.slice(-8) === b.slice(-8)) return true;
  }
  return false;
}

async function isAutorizado(message) {
  const numeroPuro = extrairNumero(message.from);
  const numeros = await prisma.numeroAutorizado.findMany({ where: { ativo: true } });

  // 1) Match por numero ou LID (LID limpo, sem @lid)
  for (const n of numeros) {
    const lidLimpo = n.lid ? n.lid.replace(/@.*$/, '') : null;
    if (numerosCorrespondem(n.numero, numeroPuro)) return true;
    if (lidLimpo && lidLimpo === numeroPuro) return true;
  }

  // 2) Resolve telefone real via contato (essencial para IDs no formato LID)
  try {
    const contact = await message.getContact();
    const nome = contact.pushname || contact.name;
    const telDoContato = extrairNumero(contact.id?._serialized || '');

    if (telDoContato) {
      for (const n of numeros) {
        if (numerosCorrespondem(n.numero, telDoContato)) {
          // Salva LID e nome automaticamente
          const updates = {};
          if (!n.lid || n.lid.includes('@')) updates.lid = numeroPuro;
          if (!n.nome && nome) updates.nome = nome;
          if (Object.keys(updates).length > 0) {
            await prisma.numeroAutorizado.update({
              where: { id: n.id },
              data: updates,
            }).catch(() => {});
          }
          return true;
        }
      }
    }
  } catch (e) {}

  console.log(`[BOT] Numero nao autorizado: ${numeroPuro}`);
  return false;
}

// --- Horário comercial ---
function dentroDoHorario(inicio, fim) {
  if (!inicio || !fim) return true;
  const agora = new Date();
  const brasiliaOffset = -3 * 60;
  const localOffset = agora.getTimezoneOffset();
  const diff = brasiliaOffset - (-localOffset);
  const hb = new Date(agora.getTime() + diff * 60000);
  const agora_min = hb.getHours() * 60 + hb.getMinutes();
  const [hi, mi] = inicio.split(':').map(Number);
  const [hf, mf] = fim.split(':').map(Number);
  return agora_min >= hi * 60 + mi && agora_min <= hf * 60 + mf;
}

// --- Conversa (agora com conexaoId) ---
async function obterConversa(numero, conexaoId) {
  let c = await prisma.conversa.findUnique({
    where: { numero_conexaoId: { numero, conexaoId } },
  });
  if (!c) c = await prisma.conversa.create({ data: { numero, conexaoId } });
  return c;
}

async function atualizarConversa(numero, conexaoId, fluxoId, nodeAtual) {
  await prisma.conversa.upsert({
    where: { numero_conexaoId: { numero, conexaoId } },
    update: { fluxoId, nodeAtual },
    create: { numero, conexaoId, fluxoId, nodeAtual },
  });
}

async function resetarConversa(numero, conexaoId) {
  await atualizarConversa(numero, conexaoId, null, null);
}

// --- Busca fluxo vinculado a esta conexão (somente fluxos com conexão definida) ---
async function buscarFluxoPorGatilho(texto, conexaoId) {
  const fluxos = await prisma.fluxo.findMany({
    where: { ativo: true, conexaoId },
  });
  const norm = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const f of fluxos) {
    const gatilhos = f.gatilhos.split(',').map((g) =>
      g.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    );
    if (gatilhos.some((g) => norm.includes(g))) return f;
  }
  return null;
}

// --- Helpers para carregamento de mídias locais ou remotas ---
function getMimeType(filePath) {
  const ext = filePath.split('.').pop().toLowerCase();
  const map = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'audio/ogg',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'pdf': 'application/pdf'
  };
  return map[ext] || 'application/octet-stream';
}

async function getMediaObject(url) {
  if (!url) return null;
  if (url.startsWith('/uploads/')) {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../../', url);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo nao encontrado: ${filePath}`);
    }
    const base64 = fs.readFileSync(filePath, { encoding: 'base64' });
    const mimeType = getMimeType(filePath);
    const filename = path.basename(filePath);
    return new MessageMedia(mimeType, base64, filename);
  } else {
    return await MessageMedia.fromUrl(url, { unsafeMime: true });
  }
}

// --- Envia conteúdo de um node ---
async function enviarConteudoNode(message, node) {
  const data = node.data || {};

  if (node.type === 'messageNode') {
    if (data.text) await message.reply(data.text);
  } else if (node.type === 'imageNode') {
    if (data.url) {
      try {
        const media = await getMediaObject(data.url);
        await message.reply(media, undefined, { caption: data.caption || '' });
      } catch (e) {
        if (data.caption) await message.reply(data.caption);
        console.error('[ERRO] Ao enviar imagem:', e.message);
      }
    }
  } else if (node.type === 'videoNode') {
    if (data.url) {
      try {
        const media = await getMediaObject(data.url);
        await message.reply(media, undefined, { caption: data.caption || '' });
      } catch (e) {
        if (data.caption) await message.reply(data.caption);
        console.error('[ERRO] Ao enviar video:', e.message);
      }
    }
  } else if (node.type === 'linkNode') {
    const texto = `${data.text || ''}\n\n🔗 ${data.url || ''}`;
    await message.reply(texto.trim());
  } else if (node.type === 'transferNode') {
    const numero = data.numero || '556199999999';
    const texto = data.text || 'Vou te transferir para nossa equipe!';
    await message.reply(`${texto}\n\n👉 https://wa.me/${numero}`);
  } else if (node.type === 'audioNode') {
    if (data.url) {
      try {
        const media = await getMediaObject(data.url);
        // Envia direto no chat (não como reply) — mais compatível com PTT
        const chat = await message.getChat();
        await chat.sendMessage(media, { sendAudioAsVoice: data.ptt !== false });
      } catch (e) {
        console.error('[ERRO] Ao enviar audio:', e.message);
      }
    }
  }
}

// --- Executa grafo ---
async function executarGrafo(message, numero, conexaoId, fluxo, startNodeId) {
  const mapa = parseMapa(fluxo);
  let currentNode = findNode(mapa, startNodeId);

  while (currentNode) {
    if (currentNode.type === 'startNode') {
      const proximos = findNextNodes(mapa, currentNode.id);
      currentNode = proximos[0] || null;
      continue;
    }

    if (currentNode.type === 'menuNode') {
      const opcoes = currentNode.data?.opcoes || [];
      let textoMenu = (currentNode.data?.text || 'Escolha:') + '\n\n';
      opcoes.forEach((op) => { textoMenu += `*${op.numero}* - ${op.label}\n`; });
      await message.reply(textoMenu);
      await atualizarConversa(numero, conexaoId, fluxo.id, currentNode.id);
      return;
    }

    if (currentNode.type === 'delayNode') {
      const seconds = Math.min(Math.max(currentNode.data?.seconds || 2, 1), 30);
      await new Promise((r) => setTimeout(r, seconds * 1000));
      const proximos = findNextNodes(mapa, currentNode.id);
      currentNode = proximos[0] || null;
      continue;
    }

    await enviarConteudoNode(message, currentNode);

    const proximos = findNextNodes(mapa, currentNode.id);
    if (proximos.length > 0) {
      currentNode = proximos[0];
    } else {
      await resetarConversa(numero, conexaoId);
      return;
    }
  }
  await resetarConversa(numero, conexaoId);
}

// --- Processa resposta menu ---
async function processarRespostaMenu(message, numero, conexaoId, fluxo, menuNodeId) {
  const mapa = parseMapa(fluxo);
  const menuNode = findNode(mapa, menuNodeId);
  if (!menuNode) { await resetarConversa(numero, conexaoId); return; }

  const texto = message.body.trim();
  const opcoes = menuNode.data?.opcoes || [];
  const opcao = opcoes.find((op) => op.numero === texto);

  if (opcao) {
    const proximos = findNextNodes(mapa, menuNode.id, opcao.id);
    if (proximos.length > 0) {
      await executarGrafo(message, numero, conexaoId, fluxo, proximos[0].id);
    } else {
      await message.reply(`Você escolheu: ${opcao.label}`);
      await resetarConversa(numero, conexaoId);
    }
  } else {
    let textoMenu = '⚠️ Opção inválida.\n\n' + (menuNode.data?.text || 'Escolha:') + '\n\n';
    opcoes.forEach((op) => { textoMenu += `*${op.numero}* - ${op.label}\n`; });
    await message.reply(textoMenu);
  }
}

// --- Criar e inicializar um client para uma conexão ---
function criarClient(conexaoId) {
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: `conexao_${conexaoId}`, dataPath: '.wwebjs_auth' }),
    puppeteer: {
      headless: true,
      protocolTimeout: 120000,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    },
  });

  const estado = {
    client,
    status: { connected: false, qrGenerated: false, info: null },
    qrCode: null,
  };

  client.on('qr', async (qr) => {
    console.log(`[WHATSAPP #${conexaoId}] QR Code gerado!`);
    qrcode.generate(qr, { small: true });
    estado.qrCode = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
    estado.status.qrGenerated = true;
    estado.status.connected = false;
  });

  client.on('ready', () => {
    console.log(`[WHATSAPP #${conexaoId}] Bot conectado e pronto!`);
    estado.status.connected = true;
    estado.status.info = client.info;
    estado.qrCode = null;
  });

  client.on('authenticated', () => {
    console.log(`[WHATSAPP #${conexaoId}] Autenticado com sucesso!`);
    estado.qrCode = null;
  });

  client.on('auth_failure', (msg) => {
    console.error(`[WHATSAPP #${conexaoId}] Falha:`, msg);
    estado.status.connected = false;
  });

  client.on('disconnected', (reason) => {
    console.log(`[WHATSAPP #${conexaoId}] Desconectado:`, reason);
    estado.status.connected = false;
    estado.qrCode = null;
  });

  // Listener de mensagens para ESTA conexão
  client.on('message', async (message) => {
    if (message.from === 'status@broadcast') return;
    if (message.from.includes('@g.us')) return;
    if (message.fromMe) return;

    if (!(await isAutorizado(message))) {
      return;
    }

    const texto = message.body.trim();
    const numero = message.from;
    console.log(`[BOT #${conexaoId}] "${texto}" de ${extrairNumero(numero)}`);

    try {
      const textoNorm = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const reiniciar = ['menu', 'voltar', 'inicio', 'sair'].includes(textoNorm);

      let conversa = await obterConversa(numero, conexaoId);

      if (conversa.fluxoId && conversa.nodeAtual && !reiniciar) {
        const fluxo = await prisma.fluxo.findUnique({ where: { id: conversa.fluxoId } });
        if (fluxo) {
          await processarRespostaMenu(message, numero, conexaoId, fluxo, conversa.nodeAtual);
          return;
        }
      }

      if (reiniciar) await resetarConversa(numero, conexaoId);

      // Verifica se existe algum fluxo ativo pra esta conexão
      const fluxosAtivos = await prisma.fluxo.findMany({
        where: { ativo: true, conexaoId },
      });

      // Se não tem nenhum fluxo pra esta conexão, fica em silêncio
      if (fluxosAtivos.length === 0) return;

      const fluxo = await buscarFluxoPorGatilho(texto, conexaoId);

      if (fluxo) {
        if (!dentroDoHorario(fluxo.horarioInicio, fluxo.horarioFim)) {
          await message.reply(fluxo.msgForaHorario || 'Estamos fora do horário.');
          return;
        }
        const mapa = parseMapa(fluxo);
        const start = findStartNode(mapa);
        if (start) {
          await atualizarConversa(numero, conexaoId, fluxo.id, start.id);
          await executarGrafo(message, numero, conexaoId, fluxo, start.id);
        }
      } else {
        await message.reply('Não entendi.\n\nDigite *menu* para ver as opções.');
      }
    } catch (error) {
      console.error(`[ERRO #${conexaoId}]`, error);
    }
  });

  conexoes.set(conexaoId, estado);
  client.initialize().catch((err) => {
    console.error(`[WHATSAPP #${conexaoId}] Erro ao inicializar:`, err.message);
    estado.status.connected = false;
  });
  console.log(`[WHATSAPP #${conexaoId}] Inicializando...`);

  return estado;
}

// --- Init: carrega todas as conexões ativas do banco ---
async function initAllConexoes() {
  const lista = await prisma.conexao.findMany({ where: { ativo: true } });
  console.log(`[WHATSAPP] Inicializando ${lista.length} conexão(ões)...`);
  for (const c of lista) {
    criarClient(c.id);
  }
}

// --- API pública ---
function iniciarConexao(conexaoId) {
  if (conexoes.has(conexaoId)) return conexoes.get(conexaoId);
  return criarClient(conexaoId);
}

function getStatusConexao(conexaoId) {
  const c = conexoes.get(conexaoId);
  if (!c) return { connected: false, qrGenerated: false, info: null, qrCode: null };
  return { ...c.status, qrCode: c.qrCode };
}

function getStatusTodas() {
  const result = {};
  for (const [id, c] of conexoes) {
    result[id] = { ...c.status, qrCode: c.qrCode };
  }
  return result;
}

async function logoutConexao(conexaoId) {
  const c = conexoes.get(conexaoId);
  if (!c) return;
  try {
    await c.client.logout();
  } catch (e) {
    console.error(`[WHATSAPP #${conexaoId}] Erro ao deslogar:`, e.message);
  }
  c.status = { connected: false, qrGenerated: false, info: null };
  c.qrCode = null;
}

async function destruirConexao(conexaoId) {
  const c = conexoes.get(conexaoId);
  if (!c) return;
  try {
    await c.client.destroy();
  } catch (e) {
    console.error(`[WHATSAPP #${conexaoId}] Erro ao destruir:`, e.message);
  }
  conexoes.delete(conexaoId);
}

function getClient(conexaoId) {
  const c = conexoes.get(conexaoId);
  if (!c) return null;
  return c.client;
}

async function listarGrupos(conexaoId) {
  const client = getClient(conexaoId);
  if (!client) return [];
  try {
    const chats = await client.getChats();
    const grupos = chats.filter((c) => c.isGroup);
    const result = [];
    for (const g of grupos) {
      let foto = null;
      try { foto = await client.getProfilePicUrl(g.id._serialized); } catch {}
      result.push({ id: g.id._serialized, nome: g.name, foto });
    }
    return result;
  } catch (e) {
    console.error(`[WHATSAPP #${conexaoId}] Erro ao listar grupos:`, e.message);
    return [];
  }
}

async function enviarMensagemParaGrupo(conexaoId, grupoId, mensagem, tipo, mediaUrl) {
  const client = getClient(conexaoId);
  if (!client) throw new Error('Conexão não encontrada ou offline');

  if ((tipo === 'imagem' || tipo === 'video') && mediaUrl) {
    const media = await getMediaObject(mediaUrl);
    await client.sendMessage(grupoId, media, { caption: mensagem || '' });
  } else {
    await client.sendMessage(grupoId, mensagem);
  }
}

async function enviarMensagemParaContato(conexaoId, numeroTelefone, lid, mensagem, tipo, mediaUrl) {
  const client = getClient(conexaoId);
  if (!client) throw new Error('Conexao nao encontrada ou offline');

  // Tenta LID primeiro (WhatsApp migrou para este formato), senão usa telefone
  const chatId = lid ? `${lid}@lid` : `${numeroTelefone}@c.us`;

  if ((tipo === 'imagem' || tipo === 'video') && mediaUrl) {
    const media = await getMediaObject(mediaUrl);
    await client.sendMessage(chatId, media, { caption: mensagem || '' });
  } else {
    await client.sendMessage(chatId, mensagem);
  }
}

async function destruirTodas() {
  for (const [id, c] of conexoes) {
    try { await c.client.destroy(); } catch {}
  }
  conexoes.clear();
}

module.exports = {
  initAllConexoes,
  destruirTodas,
  iniciarConexao,
  getStatusConexao,
  getStatusTodas,
  logoutConexao,
  destruirConexao,
  getClient,
  listarGrupos,
  enviarMensagemParaGrupo,
  enviarMensagemParaContato,
};
