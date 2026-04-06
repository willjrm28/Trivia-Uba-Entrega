const express = require('express');
const router = express.Router();
const {
    obtenerEventos,
    obtenerEventoActivo,
    crearEvento,
    activarEvento,
    finalizarEvento,
    editarEvento,
    reprogramarEvento,
    reabrirEvento
} = require('../controllers/eventosController');

// Rutas
router.get('/', obtenerEventos);
router.get('/activo', obtenerEventoActivo);
router.post('/', crearEvento);
router.put('/activar/:id', activarEvento);
router.put('/finalizar/:id', finalizarEvento);
router.put('/:id', editarEvento);
router.put('/reprogramar/:id', reprogramarEvento);
router.put('/reabrir/:id', reabrirEvento);

module.exports = router;