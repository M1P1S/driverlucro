const express = require('express');
const router = express.Router();
const { resumoGeral } = require('../controllers/dashboard.controller');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/', resumoGeral);

module.exports = router;