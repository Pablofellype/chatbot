const prisma = require('../database/prisma');
const { enviarMensagemParaGrupo, enviarMensagemParaContato } = require('./whatsappService');

const diasMap = { 0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' };

function getHorarioBrasilia() {
  const agora = new Date();
  const brasiliaOffset = -3 * 60;
  const localOffset = agora.getTimezoneOffset();
  const diff = brasiliaOffset - (-localOffset);
  const hb = new Date(agora.getTime() + diff * 60000);
  return {
    horas: hb.getHours(),
    minutos: hb.getMinutes(),
    diaSemana: diasMap[hb.getDay()],
    data: hb,
  };
}

function deveEnviarHoje(msg, diaSemana) {
  if (msg.frequencia === 'diario') return true;

  if (msg.frequencia === 'semanal' && msg.diasSemana) {
    const dias = msg.diasSemana.split(',').map((d) => d.trim().toLowerCase());
    return dias.includes(diaSemana);
  }

  if (msg.frequencia === 'uma_vez') {
    return !msg.ultimoEnvio;
  }

  return false;
}

async function verificarEEnviar() {
  const { horas, minutos, diaSemana } = getHorarioBrasilia();
  const horaAtual = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;

  try {
    const mensagens = await prisma.mensagemAutomatica.findMany({
      where: { ativo: true, horario: horaAtual },
    });

    for (const msg of mensagens) {
      if (!deveEnviarHoje(msg, diaSemana)) continue;

      // Verifica se já enviou neste minuto
      if (msg.ultimoEnvio) {
        const diff = Date.now() - new Date(msg.ultimoEnvio).getTime();
        if (diff < 60000) continue;
      }

      try {
        await enviarMensagemParaGrupo(msg.conexaoId, msg.grupoId, msg.mensagem, msg.tipo, msg.mediaUrl);
        await prisma.mensagemAutomatica.update({
          where: { id: msg.id },
          data: { ultimoEnvio: new Date() },
        });
        console.log(`[SCHEDULER] Mensagem "${msg.nome}" enviada para ${msg.grupoNome}`);
      } catch (e) {
        console.error(`[SCHEDULER] Erro ao enviar "${msg.nome}":`, e.message);
      }
    }
    // --- Mensagens individuais ---
    const individuais = await prisma.mensagemIndividual.findMany({
      where: { ativo: true, horario: horaAtual },
      include: { numero: true },
    });

    for (const msg of individuais) {
      if (!deveEnviarHoje(msg, diaSemana)) continue;

      if (msg.ultimoEnvio) {
        const diff = Date.now() - new Date(msg.ultimoEnvio).getTime();
        if (diff < 60000) continue;
      }

      try {
        await enviarMensagemParaContato(msg.conexaoId, msg.numero.numero, msg.numero.lid, msg.mensagem, msg.tipo, msg.mediaUrl);
        await prisma.mensagemIndividual.update({
          where: { id: msg.id },
          data: { ultimoEnvio: new Date() },
        });
        console.log(`[SCHEDULER] Individual "${msg.nome}" enviada para ${msg.numero.nome || msg.numero.numero}`);
      } catch (e) {
        console.error(`[SCHEDULER] Erro individual "${msg.nome}":`, e.message);
      }
    }
  } catch (e) {
    console.error('[SCHEDULER] Erro:', e.message);
  }
}

function iniciarScheduler() {
  console.log('[SCHEDULER] Verificando mensagens automaticas a cada minuto...');
  setInterval(verificarEEnviar, 60000);
}

module.exports = { iniciarScheduler };
