const express = require('express');
const router = express.Router();
const { avaliarCorrida, listarAvaliacoes, getConfigAvaliador } = require('../controllers/avaliador.controller');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/config', getConfigAvaliador);
router.post('/avaliar', avaliarCorrida);
router.get('/historico', listarAvaliacoes);

module.exports = router;
