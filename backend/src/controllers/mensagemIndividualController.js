const prisma = require('../database/prisma');
const { enviarMensagemParaContato } = require('../services/whatsappService');

const listar = async (req, res) => {
  try {
    const msgs = await prisma.mensagemIndividual.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        conexao: { select: { id: true, nome: true } },
        numero: { select: { id: true, numero: true, nome: true, lid: true } },
      },
    });
    res.json(msgs);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar' });
  }
};

const criar = async (req, res) => {
  try {
    const { nome, mensagem, tipo, mediaUrl, numeroId, conexaoId, frequencia, diasSemana, horario } = req.body;
    if (!nome || !mensagem || !numeroId || !conexaoId || !horario) {
      return res.status(400).json({ erro: 'nome, mensagem, numeroId, conexaoId e horario obrigatorios' });
    }

    const msg = await prisma.mensagemIndividual.create({
      data: {
        nome, mensagem,
        tipo: tipo || 'texto',
        mediaUrl: mediaUrl || null,
        numeroId: parseInt(numeroId),
        conexaoId: parseInt(conexaoId),
        frequencia: frequencia || 'uma_vez',
        diasSemana: diasSemana || null,
        horario,
      },
      include: {
        conexao: { select: { id: true, nome: true } },
        numero: { select: { id: true, numero: true, nome: true, lid: true } },
      },
    });
    res.status(201).json(msg);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao criar' });
  }
};

const atualizar = async (req, res) => {
  try {
    const { nome, mensagem, tipo, mediaUrl, numeroId, conexaoId, frequencia, diasSemana, horario, ativo } = req.body;
    const resetUltimoEnvio = mensagem !== undefined || mediaUrl !== undefined || horario !== undefined || frequencia !== undefined || diasSemana !== undefined || ativo !== undefined || tipo !== undefined;

    const msg = await prisma.mensagemIndividual.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(nome !== undefined && { nome }),
        ...(mensagem !== undefined && { mensagem }),
        ...(tipo !== undefined && { tipo }),
        ...(mediaUrl !== undefined && { mediaUrl }),
        ...(numeroId !== undefined && { numeroId: parseInt(numeroId) }),
        ...(conexaoId !== undefined && { conexaoId: parseInt(conexaoId) }),
        ...(frequencia !== undefined && { frequencia }),
        ...(diasSemana !== undefined && { diasSemana }),
        ...(horario !== undefined && { horario }),
        ...(ativo !== undefined && { ativo }),
        ...(resetUltimoEnvio && { ultimoEnvio: null }),
      },
      include: {
        conexao: { select: { id: true, nome: true } },
        numero: { select: { id: true, numero: true, nome: true, lid: true } },
      },
    });
    res.json(msg);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ erro: 'Nao encontrado' });
    res.status(500).json({ erro: 'Erro ao atualizar' });
  }
};

const deletar = async (req, res) => {
  try {
    await prisma.mensagemIndividual.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ mensagem: 'Removido' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ erro: 'Nao encontrado' });
    res.status(500).json({ erro: 'Erro ao deletar' });
  }
};

const enviarAgora = async (req, res) => {
  try {
    const msg = await prisma.mensagemIndividual.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { numero: true },
    });
    if (!msg) return res.status(404).json({ erro: 'Nao encontrado' });

    await enviarMensagemParaContato(msg.conexaoId, msg.numero.numero, msg.numero.lid, msg.mensagem, msg.tipo, msg.mediaUrl);

    await prisma.mensagemIndividual.update({
      where: { id: msg.id },
      data: { ultimoEnvio: new Date() },
    });

    res.json({ mensagem: 'Enviado' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao enviar: ' + error.message });
  }
};

module.exports = { listar, criar, atualizar, deletar, enviarAgora };
