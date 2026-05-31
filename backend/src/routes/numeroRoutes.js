const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/numeroController');

router.get('/', ctrl.listar);
router.post('/', ctrl.criar);
router.put('/:id', ctrl.atualizar);
router.delete('/:id', ctrl.deletar);

module.exports = router;
