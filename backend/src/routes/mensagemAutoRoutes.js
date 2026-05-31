const express = require('express');
const router = express.Router();
const controller = require('../controllers/mensagemAutoController');

router.get('/', controller.listar);
router.post('/', controller.criar);
router.put('/:id', controller.atualizar);
router.delete('/:id', controller.deletar);
router.get('/grupos/:conexaoId', controller.grupos);
router.post('/:id/enviar', controller.enviarAgora);

module.exports = router;
