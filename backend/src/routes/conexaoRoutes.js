const express = require('express');
const router = express.Router();
const conexaoController = require('../controllers/conexaoController');

router.get('/', conexaoController.listar);
router.post('/', conexaoController.criar);
router.get('/:id/status', conexaoController.obterStatus);
router.put('/:id', conexaoController.atualizar);
router.delete('/:id', conexaoController.deletar);
router.post('/:id/logout', conexaoController.logout);
router.post('/:id/reconectar', conexaoController.reconectar);
router.post('/:id/verificar-senha', conexaoController.verificarSenha);
router.get('/:id/contatos', conexaoController.listarContatos);

module.exports = router;
