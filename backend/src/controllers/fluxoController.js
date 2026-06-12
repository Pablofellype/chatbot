const prisma = require('../database/prisma');

const listar = async (req, res) => {
  try {
    const fluxos = await prisma.fluxo.findMany({
      orderBy: { criadoEm: 'desc' },
      include: { conexao: { select: { id: true, nome: true } } },
    });
    res.json(fluxos.map((f) => ({ ...f, mapa: JSON.parse(f.mapa) })));
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar fluxos' });
  }
};

const obter = async (req, res) => {
  try {
    const fluxo = await prisma.fluxo.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!fluxo) return res.status(404).json({ erro: 'Fluxo não encontrado' });
    res.json({ ...fluxo, mapa: JSON.parse(fluxo.mapa) });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao obter fluxo' });
  }
};

const criar = async (req, res) => {
  try {
    const { nome, gatilhos, horarioInicio, horarioFim, msgForaHorario, mapa, conexaoId } = req.body;
    if (!nome || !gatilhos) return res.status(400).json({ erro: 'nome e gatilhos obrigatórios' });

    const fluxo = await prisma.fluxo.create({
      data: {
        nome, gatilhos,
        horarioInicio: horarioInicio || null,
        horarioFim: horarioFim || null,
        msgForaHorario: msgForaHorario || null,
        mapa: mapa ? JSON.stringify(mapa) : '{"nodes":[],"edges":[]}',
        conexaoId: conexaoId || null,
      },
      include: { conexao: { select: { id: true, nome: true } } },
    });
    res.status(201).json({ ...fluxo, mapa: JSON.parse(fluxo.mapa) });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao criar fluxo' });
  }
};

const atualizar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const original = await prisma.fluxo.findUnique({ where: { id } });
    if (!original) return res.status(404).json({ erro: 'Não encontrado' });

    if (original.isTemplate) {
      return res.status(400).json({ erro: 'Este é um fluxo modelo e não pode ser editado.' });
    }

    const { nome, gatilhos, ativo, horarioInicio, horarioFim, msgForaHorario, mapa, conexaoId } = req.body;
    const fluxo = await prisma.fluxo.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(gatilhos !== undefined && { gatilhos }),
        ...(ativo !== undefined && { ativo }),
        ...(horarioInicio !== undefined && { horarioInicio }),
        ...(horarioFim !== undefined && { horarioFim }),
        ...(msgForaHorario !== undefined && { msgForaHorario }),
        ...(mapa !== undefined && { mapa: JSON.stringify(mapa) }),
        ...(conexaoId !== undefined && { conexaoId: conexaoId || null }),
      },
      include: { conexao: { select: { id: true, nome: true } } },
    });
    res.json({ ...fluxo, mapa: JSON.parse(fluxo.mapa) });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ erro: 'Não encontrado' });
    res.status(500).json({ erro: 'Erro ao atualizar' });
  }
};

const deletar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const original = await prisma.fluxo.findUnique({ where: { id } });
    if (!original) return res.status(404).json({ erro: 'Não encontrado' });

    if (original.isTemplate) {
      return res.status(400).json({ erro: 'Este é um fluxo modelo e não pode ser excluído.' });
    }

    await prisma.fluxo.delete({ where: { id } });
    res.json({ mensagem: 'Removido' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ erro: 'Não encontrado' });
    res.status(500).json({ erro: 'Erro ao deletar' });
  }
};

const duplicar = async (req, res) => {
  try {
    const original = await prisma.fluxo.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!original) return res.status(404).json({ erro: 'Não encontrado' });

    const copia = await prisma.fluxo.create({
      data: {
        nome: original.nome + ' (Cópia)',
        gatilhos: original.gatilhos,
        horarioInicio: original.horarioInicio,
        horarioFim: original.horarioFim,
        msgForaHorario: original.msgForaHorario,
        mapa: original.mapa,
        conexaoId: original.conexaoId,
        ativo: false,
        isTemplate: false,
      },
      include: { conexao: { select: { id: true, nome: true } } },
    });
    res.status(201).json({ ...copia, mapa: JSON.parse(copia.mapa) });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao duplicar' });
  }
};

module.exports = { listar, obter, criar, atualizar, deletar, duplicar };
