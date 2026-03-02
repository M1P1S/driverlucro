const express = require('express');
const router = express.Router();
const { listar, criar, deletar, getAlertas, getTipos } = require('../controllers/manutencoes.controller');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/alertas', getAlertas);
router.get('/tipos', getTipos);
router.get('/', listar);
router.post('/', criar);
router.delete('/:id', deletar);

module.exports = router;