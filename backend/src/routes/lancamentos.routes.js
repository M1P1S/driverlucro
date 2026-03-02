const express = require('express');
const router = express.Router();
const { listar, criar, atualizar, deletar, resumoPorPlataforma } = require('../controllers/lancamentos.controller');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/', listar);
router.get('/resumo', resumoPorPlataforma);
router.post('/', criar);
router.put('/:id', atualizar);
router.delete('/:id', deletar);

module.exports = router;