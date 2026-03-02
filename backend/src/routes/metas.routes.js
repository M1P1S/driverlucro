const express = require('express');
const router = express.Router();
const { getConfig, updateConfig, getMetaHoje, getHistorico } = require('../controllers/metas.controller');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/config', getConfig);
router.put('/config', updateConfig);
router.get('/hoje', getMetaHoje);
router.get('/historico', getHistorico);

module.exports = router;