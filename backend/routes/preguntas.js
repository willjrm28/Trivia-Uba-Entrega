const express = require('express');
const router = express.Router();
const {
    obtenerPreguntas,
    crearPregunta,
    editarPregunta,
    eliminarPregunta,
    obtenerOpciones
} = require('../controllers/preguntasController');

// Rutas
router.get('/', obtenerPreguntas);
router.get('/filtrar', obtenerPreguntas);
router.get('/:id/opciones', obtenerOpciones);
router.post('/', crearPregunta);
router.put('/:id', editarPregunta);
router.delete('/:id', eliminarPregunta);

module.exports = router;