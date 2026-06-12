const prisma = require('../database/prisma');
const { listarGrupos, enviarMensagemParaGrupo } = require('../services/whatsappService');

const listar = async (req, res) => {
  try {
    const mensagens = await prisma.mensagemAutomatica.findMany({
      orderBy: { criadoEm: 'desc' },
      include: { conexao: { select: { id: true, nome: true } } },
    });
    res.json(mensagens);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar mensagens automaticas' });
  }
};

const criar = async (req, res) => {
  try {
    const { nome, mensagem, tipo, mediaUrl, grupoId, grupoNome, conexaoId, frequencia, diasSemana, horario } = req.body;
    if (!nome || !mensagem || !grupoId || !conexaoId || !horario) {
      return res.status(400).json({ erro: 'Campos obrigatórios: nome, mensagem, grupoId, conexaoId, horario' });
    }

    const msg = await prisma.mensagemAutomatica.create({
      data: {
        nome,
        mensagem,
        tipo: tipo || 'texto',
        mediaUrl: mediaUrl || null,
        grupoId,
        grupoNome: grupoNome || grupoId,
        conexaoId: parseInt(conexaoId),
        frequencia: frequencia || 'diario',
        diasSemana: diasSemana || null,
        horario,
      },
      include: { conexao: { select: { id: true, nome: true } } },
    });
    res.status(201).json(msg);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao criar mensagem automatica' });
  }
};

const atualizar = async (req, res) => {
  try {
    const { nome, mensagem, tipo, mediaUrl, grupoId, grupoNome, conexaoId, frequencia, diasSemana, horario, ativo } = req.body;
    const resetUltimoEnvio = mensagem !== undefined || mediaUrl !== undefined || horario !== undefined || frequencia !== undefined || diasSemana !== undefined || ativo !== undefined || tipo !== undefined;

    const msg = await prisma.mensagemAutomatica.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(nome !== undefined && { nome }),
        ...(mensagem !== undefined && { mensagem }),
        ...(tipo !== undefined && { tipo }),
        ...(mediaUrl !== undefined && { mediaUrl }),
        ...(grupoId !== undefined && { grupoId }),
        ...(grupoNome !== undefined && { grupoNome }),
        ...(conexaoId !== undefined && { conexaoId: parseInt(conexaoId) }),
        ...(frequencia !== undefined && { frequencia }),
        ...(diasSemana !== undefined && { diasSemana }),
        ...(horario !== undefined && { horario }),
        ...(ativo !== undefined && { ativo }),
        ...(resetUltimoEnvio && { ultimoEnvio: null }),
      },
      include: { conexao: { select: { id: true, nome: true } } },
    });
    res.json(msg);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ erro: 'Não encontrada' });
    res.status(500).json({ erro: 'Erro ao atualizar' });
  }
};

const deletar = async (req, res) => {
  try {
    await prisma.mensagemAutomatica.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ mensagem: 'Removida' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ erro: 'Não encontrada' });
    res.status(500).json({ erro: 'Erro ao deletar' });
  }
};

const grupos = async (req, res) => {
  try {
    const conexaoId = parseInt(req.params.conexaoId);
    const lista = await listarGrupos(conexaoId);
    res.json(lista);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar grupos' });
  }
};

const enviarAgora = async (req, res) => {
  try {
    const msg = await prisma.mensagemAutomatica.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!msg) return res.status(404).json({ erro: 'Não encontrada' });

    await enviarMensagemParaGrupo(msg.conexaoId, msg.grupoId, msg.mensagem, msg.tipo, msg.mediaUrl);
    await prisma.mensagemAutomatica.update({
      where: { id: msg.id },
      data: { ultimoEnvio: new Date() },
    });
    res.json({ mensagem: 'Enviada com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao enviar: ' + error.message });
  }
};

module.exports = { listar, criar, atualizar, deletar, grupos, enviarAgora };
