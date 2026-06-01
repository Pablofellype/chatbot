const prisma = require('../database/prisma');
const whatsappService = require('../services/whatsappService');

const listar = async (req, res) => {
  try {
    const numeros = await prisma.numeroAutorizado.findMany({
      orderBy: { criadoEm: 'desc' },
      include: { conexao: { select: { id: true, nome: true } } },
    });

    const obterFotoComTimeout = (num) => {
      return new Promise((resolve) => {
        const identificador = num.lid || num.numero;
        if (!identificador) return resolve({ ...num, fotoUrl: null });

        const timeout = setTimeout(() => resolve({ ...num, fotoUrl: null }), 600);
        whatsappService.obterFotoPerfil(identificador)
          .then((url) => {
            clearTimeout(timeout);
            resolve({ ...num, fotoUrl: url });
          })
          .catch(() => {
            clearTimeout(timeout);
            resolve({ ...num, fotoUrl: null });
          });
      });
    };

    const numerosEnriquecidos = await Promise.all(numeros.map(obterFotoComTimeout));
    res.json(numerosEnriquecidos);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar' });
  }
};

function numerosCorrespondem(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 8 && b.length >= 8) {
    if (a.endsWith(b) || b.endsWith(a)) return true;
    if (a.slice(-8) === b.slice(-8)) return true;
  }
  return false;
}

const criar = async (req, res) => {
  try {
    const { numero, nome, lid } = req.body;
    if (!numero) return res.status(400).json({ erro: 'numero obrigatório' });

    // Remove formatação: +55 61 99258-1786 → 5561992581786
    const limpo = numero.replace(/[\s\-\+\(\)]/g, '');

    // Busca todos para verificar correspondência flexível (últimos 8 dígitos - resolve 9º dígito)
    const todos = await prisma.numeroAutorizado.findMany();
    const correspondentes = todos.filter(n => numerosCorrespondem(n.numero, limpo));

    if (correspondentes.length > 0) {
      const existente = correspondentes[0];
      
      // Se houver mais de um correspondente já cadastrado (duplicados antigos), remove automaticamente os extras!
      if (correspondentes.length > 1) {
        const idsParaDeletar = correspondentes.slice(1).map(c => c.id);
        await prisma.numeroAutorizado.deleteMany({
          where: { id: { in: idsParaDeletar } }
        });
      }

      // Atualiza nome/lid se enviados e preserva intocado o estado 'ativo' e tudo o que já estava antes!
      const dataUpdate = {};
      if (nome && !existente.nome) dataUpdate.nome = nome;
      if (lid && !existente.lid) dataUpdate.lid = lid;
      
      // Se o número novo tem mais dígitos (ex: 13 dígitos vs 12), atualiza a grafia do número
      if (limpo.length > existente.numero.length) {
        dataUpdate.numero = limpo;
      }

      const atualizado = await prisma.numeroAutorizado.update({
        where: { id: existente.id },
        data: dataUpdate
      });
      return res.status(200).json(atualizado);
    }

    const n = await prisma.numeroAutorizado.create({
      data: { numero: limpo, nome: nome || null, lid: lid || null },
    });
    res.status(201).json(n);
  } catch (error) {
    if (error.code === 'P2002') {
      const todos = await prisma.numeroAutorizado.findMany();
      const existente = todos.find(n => numerosCorrespondem(n.numero, numero.replace(/[\s\-\+\(\)]/g, '')));
      if (existente) return res.status(200).json(existente);
      return res.status(400).json({ erro: 'Número já cadastrado' });
    }
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
    const id = parseInt(req.params.id);
    
    // Remove em cascata qualquer agendamento vinculado a este número primeiro
    await prisma.mensagemIndividual.deleteMany({ where: { numeroId: id } });
    
    // Deleta o número com total segurança do banco de dados
    await prisma.numeroAutorizado.delete({ where: { id } });
    
    res.json({ mensagem: 'Removido' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ erro: 'Não encontrado' });
    res.status(500).json({ erro: 'Erro ao deletar: ' + error.message });
  }
};

module.exports = { listar, criar, atualizar, deletar };
