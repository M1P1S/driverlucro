const express = require('express');
const router = express.Router();
const { register, login, perfil } = require('../controllers/auth.controller');
const { authMiddleware } = require('../middlewares/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/perfil', authMiddleware, perfil);

module.exports = router;