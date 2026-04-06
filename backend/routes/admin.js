const express = require('express');
const router = express.Router();
const { login, crearAdmin, cambiarPassword } = require('../controllers/adminController');
const verificarToken = require('../middlewares/auth');

// Rutas públicas (sin token)
router.post('/login', login);
router.post('/crear', crearAdmin);

// Rutas protegidas (requieren token)
router.put('/cambiar-password', verificarToken, cambiarPassword);

module.exports = router;