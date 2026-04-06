const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const preguntasRoutes = require('./routes/preguntas');
const eventosRoutes = require('./routes/eventos');
const participacionesRoutes = require('./routes/participaciones');
const adminRoutes = require('./routes/admin');
const db = require('./config/database');

const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir el frontend como archivos estáticos
app.use(express.static(path.join(__dirname, '../frontend')));

// Rutas
app.use('/api/preguntas', preguntasRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/participaciones', participacionesRoutes);
app.use('/api/admin', adminRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ 
        mensaje: '¡Servidor de Trivia UBA funcionando!',
        version: '1.0.0'
    });
});

// ─────────────────────────────────────────
// CRON JOB: Revisión automática de eventos
// Se ejecuta cada 5 minutos
// ─────────────────────────────────────────
async function revisarEventos() {
    try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const hoyStr = hoy.toISOString().split('T')[0];

        // 1. Activar eventos cuya fecha_inicio es hoy y están Inactivos o Reprogramados
        const [activar] = await db.query(`
            SELECT id, nombre FROM eventos
            WHERE estado IN ('Inactivo', 'Reprogramado')
            AND DATE(fecha_inicio) <= ?
            AND DATE(fecha_fin) >= ?
        `, [hoyStr, hoyStr]);

        for (const evento of activar) {
            // Primero pasar cualquier activo actual a Inactivo
            await db.query(`
                UPDATE eventos SET estado = 'Inactivo'
                WHERE estado = 'Activo' AND id != ?
            `, [evento.id]);

            // Luego activar este
            await db.query(`
                UPDATE eventos SET estado = 'Activo' WHERE id = ?
            `, [evento.id]);

            console.log(`✅ Evento activado automáticamente: ${evento.nombre}`);
        }

        // 2. Finalizar eventos cuya fecha_fin ya pasó y siguen Activos o Reprogramados
        const [finalizar] = await db.query(`
            SELECT id, nombre FROM eventos
            WHERE estado IN ('Activo', 'Reprogramado')
            AND DATE(fecha_fin) < ?
        `, [hoyStr]);

        for (const evento of finalizar) {
            await db.query(`
                UPDATE eventos SET estado = 'Finalizado' WHERE id = ?
            `, [evento.id]);

            console.log(`🏁 Evento finalizado automáticamente: ${evento.nombre}`);
        }

    } catch (error) {
        console.error('Error en revisión automática de eventos:', error.message);
        console.error(error);
    }
}

// Ejecutar al iniciar el servidor
revisarEventos();

// Ejecutar cada 5 minutos
setInterval(revisarEventos, 5 * 60 * 1000);

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🕐 Revisión automática de eventos activa (cada 5 min)`);
});