const express = require('express');
const router = express.Router();
const { importarCorridaIndividual, importarResumo, importarCSV, previewCSV } = require('../controllers/importacao.controller');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.post('/corrida', importarCorridaIndividual);
router.post('/resumo', importarResumo);
router.post('/csv', importarCSV);
router.post('/csv/preview', previewCSV);

module.exports = router;
