const prisma = require('../database/prisma');

const listar = async (req, res) => {
  try {
    const numeros = await prisma.numeroAutorizado.findMany({
      orderBy: { criadoEm: 'desc' },
      include: { conexao: { select: { id: true, nome: true } } },
    });
    res.json(numeros);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar' });
  }
};

const criar = async (req, res) => {
  try {
    const { numero, nome, lid } = req.body;
    if (!numero) return res.status(400).json({ erro: 'numero obrigatório' });

    // Remove formatação: +55 61 99258-1786 → 5561992581786
    const limpo = numero.replace(/[\s\-\+\(\)]/g, '');

    const n = await prisma.numeroAutorizado.create({
      data: { numero: limpo, nome: nome || null, lid: lid || null },
    });
    res.status(201).json(n);
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ erro: 'Número já cadastrado' });
    res.status(500).json({ erro: 'Erro ao criar' });
  }
};

const atualizar = async (req, res) => {
  try {
    const { numero, nome, lid, ativo, conexaoId } = req.body;
    const data = {
      ...(nome !== undefined && { nome }),
      ...(lid !== undefined && { lid }),
      ...(ativo !== undefined && { ativo }),
      ...(conexaoId !== undefined && { conexaoId: conexaoId ? parseInt(conexaoId) : null }),
    };
    if (numero !== undefined) {
      data.numero = numero.replace(/[\s\-\+\(\)]/g, '');
    }
    const n = await prisma.numeroAutorizado.update({
      where: { id: parseInt(req.params.id) },
      data,
    });
    res.json(n);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ erro: 'Não encontrado' });
    if (error.code === 'P2002') return res.status(400).json({ erro: 'Número já cadastrado' });
    res.status(500).json({ erro: 'Erro ao atualizar' });
  }
};

const deletar = async (req, res) => {
  try {
    await prisma.numeroAutorizado.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ mensagem: 'Removido' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ erro: 'Não encontrado' });
    res.status(500).json({ erro: 'Erro ao deletar' });
  }
};

module.exports = { listar, criar, atualizar, deletar };
