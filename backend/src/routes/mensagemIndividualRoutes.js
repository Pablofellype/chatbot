const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/mensagemIndividualController');

router.get('/', ctrl.listar);
router.post('/', ctrl.criar);
router.put('/:id', ctrl.atualizar);
router.delete('/:id', ctrl.deletar);
router.post('/:id/enviar', ctrl.enviarAgora);

module.exports = router;
