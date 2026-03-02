const express = require('express');
const router = express.Router();
const { listar, criar, atualizar, deletar } = require('../controllers/carros.controller');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/', listar);
router.post('/', criar);
router.put('/:id', atualizar);
router.delete('/:id', deletar);

module.exports = router;