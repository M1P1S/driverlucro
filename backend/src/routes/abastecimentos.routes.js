const express = require('express');
const router = express.Router();
const { listar, criar, deletar, resumoConsumo } = require('../controllers/abastecimentos.controller');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/', listar);
router.get('/resumo', resumoConsumo);
router.post('/', criar);
router.delete('/:id', deletar);

module.exports = router;