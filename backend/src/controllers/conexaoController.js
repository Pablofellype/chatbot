const prisma = require('../database/prisma');
const {
  iniciarConexao,
  getStatusConexao,
  getStatusTodas,
  logoutConexao,
  destruirConexao,
  listarContatos: listarContatosService,
} = require('../services/whatsappService');

const listar = async (req, res) => {
  try {
    const conexoes = await prisma.conexao.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        _count: { select: { fluxos: true } },
        responsaveis: { select: { id: true, numero: true, nome: true, ativo: true } },
      },
    });
    const statusMap = getStatusTodas();
    const result = conexoes.map((c) => ({
      ...c,
      totalFluxos: c._count.fluxos,
      status: statusMap[c.id] || { connected: false, qrGenerated: false, info: null, qrCode: null },
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar conexões' });
  }
};

const criar = async (req, res) => {
  try {
    const { nome, apelido } = req.body;
    if (!nome) return res.status(400).json({ erro: 'nome obrigatório' });

    const conexao = await prisma.conexao.create({ data: { nome, apelido: apelido || null } });
    // Inicia o client WhatsApp para esta conexão
    iniciarConexao(conexao.id);

    res.status(201).json(conexao);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao criar conexão' });
  }
};

const obterStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const conexao = await prisma.conexao.findUnique({ where: { id } });
    if (!conexao) return res.status(404).json({ erro: 'Conexão não encontrada' });

    const status = getStatusConexao(id);
    res.json({ ...conexao, status });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao obter status' });
  }
};

const atualizar = async (req, res) => {
  try {
    const { nome, apelido, senha, ativo } = req.body;
    const id = parseInt(req.params.id);
    const conexao = await prisma.conexao.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(apelido !== undefined && { apelido }),
        ...(senha !== undefined && { senha }),
        ...(ativo !== undefined && { ativo }),
      },
    });
    res.json(conexao);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ erro: 'Não encontrada' });
    res.status(500).json({ erro: 'Erro ao atualizar' });
  }
};

const deletar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Remove fluxos vinculados desta conexão (desvincula)
    await prisma.fluxo.updateMany({ where: { conexaoId: id }, data: { conexaoId: null } });
    // Remove conversas desta conexão
    await prisma.conversa.deleteMany({ where: { conexaoId: id } });
    // Destroi o client
    await destruirConexao(id);
    // Remove do banco
    await prisma.conexao.delete({ where: { id } });
    res.json({ mensagem: 'Conexão removida' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ erro: 'Não encontrada' });
    res.status(500).json({ erro: 'Erro ao deletar' });
  }
};

const logout = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await logoutConexao(id);
    res.json({ mensagem: 'Desconectado' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao desconectar' });
  }
};

const reconectar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const conexao = await prisma.conexao.findUnique({ where: { id } });
    if (!conexao) return res.status(404).json({ erro: 'Conexão não encontrada' });

    await destruirConexao(id);
    iniciarConexao(id);
    res.json({ mensagem: 'Reconectando...' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao reconectar' });
  }
};

const verificarSenha = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { senha } = req.body;
    const conexao = await prisma.conexao.findUnique({ where: { id } });
    if (!conexao) return res.status(404).json({ erro: 'Não encontrada' });

    if (!conexao.senha) return res.json({ ok: true });
    if (conexao.senha === senha) return res.json({ ok: true });
    return res.status(401).json({ erro: 'Senha incorreta' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao verificar' });
  }
};

const listarContatos = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const contatos = await listarContatosService(id);
    res.json(contatos);
  } catch (error) {
    console.error('[ERRO API] Ao listar contatos:', error.message);
    res.status(500).json({ erro: 'Erro ao listar contatos' });
  }
};

module.exports = { listar, criar, obterStatus, atualizar, deletar, logout, reconectar, verificarSenha, listarContatos };
