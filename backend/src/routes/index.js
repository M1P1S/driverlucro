const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const carrosRoutes = require('./carros.routes');
const lancamentosRoutes = require('./lancamentos.routes');
const dashboardRoutes = require('./dashboard.routes');
const abastecimentosRoutes = require('./abastecimentos.routes');
const metasRoutes = require('./metas.routes');
const manutencoesRoutes = require('./manutencoes.routes');
const avaliadorRoutes = require('./avaliador.routes');
const importacaoRoutes = require('./importacao.routes');

router.use('/auth', authRoutes);
router.use('/carros', carrosRoutes);
router.use('/lancamentos', lancamentosRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/abastecimentos', abastecimentosRoutes);
router.use('/metas', metasRoutes);
router.use('/manutencoes', manutencoesRoutes);
router.use('/avaliador', avaliadorRoutes);
router.use('/importacao', importacaoRoutes);

module.exports = router;