const express = require('express');
const router = express.Router();
const { avaliarCorrida, listarAvaliacoes, getConfigAvaliador, avaliarRapido } = require('../controllers/avaliador.controller');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/config', getConfigAvaliador);
router.post('/avaliar', avaliarCorrida);
router.post('/avaliar-rapido', avaliarRapido);
router.get('/historico', listarAvaliacoes);

module.exports = router;
