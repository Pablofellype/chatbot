const express = require('express');
const router = express.Router();
const fluxoController = require('../controllers/fluxoController');

router.get('/', fluxoController.listar);
router.get('/:id', fluxoController.obter);
router.post('/', fluxoController.criar);
router.put('/:id', fluxoController.atualizar);
router.post('/:id/duplicar', fluxoController.duplicar);
router.delete('/:id', fluxoController.deletar);

module.exports = router;
