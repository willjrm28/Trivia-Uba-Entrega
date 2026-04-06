const express = require('express');
const router = express.Router();
const path = require('path');
const { exportarExcel } = require('../controllers/excelController');
const {
    registrarParticipacion,
    obtenerEstadisticas,
    obtenerPreguntasAleatorias,
    obtenerMetricasPorDia
} = require('../controllers/participacionesController');

// Rutas
router.post('/', registrarParticipacion);
router.get('/estadisticas', obtenerEstadisticas);
router.get('/preguntas', obtenerPreguntasAleatorias);
router.get('/metricas-por-dia', obtenerMetricasPorDia);
router.post('/exportar-excel', exportarExcel);

// Descarga del reglamento
router.get('/reglamento', (req, res) => {
    const filePath = path.join(__dirname, '../../frontend/docs/reglas.pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Reglamento-Trivia-UBA.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(filePath);
});

module.exports = router;