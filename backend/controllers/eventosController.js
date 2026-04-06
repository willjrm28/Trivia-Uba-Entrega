const db = require('../config/database');

// Obtener todos los eventos
const obtenerEventos = async (req, res) => {
    try {
        const [eventos] = await db.query(
            'SELECT * FROM eventos ORDER BY created_at DESC'
        );
        res.json({
            success: true,
            data: eventos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener eventos',
            error: error.message
        });
    }
};

// Obtener evento activo
const obtenerEventoActivo = async (req, res) => {
    try {
        const [eventos] = await db.query(
            "SELECT * FROM eventos WHERE estado = 'Activo' LIMIT 1"
        );
        if (eventos.length === 0) {
            return res.json({
                success: false,
                mensaje: 'No hay ningún evento activo'
            });
        }
        res.json({
            success: true,
            data: eventos[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener evento activo',
            error: error.message
        });
    }
};

// Crear evento
const crearEvento = async (req, res) => {
    try {
        const { codigo, nombre, descripcion, fecha_inicio, fecha_fin, ubicacion } = req.body;

        // Verificar que el código no exista
        const [existe] = await db.query(
            'SELECT id FROM eventos WHERE codigo = ?', [codigo]
        );

        if (existe.length > 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'El código de evento ya existe. Por favor use uno diferente'
            });
        }

        await db.query(
            'INSERT INTO eventos (codigo, nombre, descripcion, fecha_inicio, fecha_fin, ubicacion) VALUES (?, ?, ?, ?, ?, ?)',
            [codigo, nombre, descripcion, fecha_inicio, fecha_fin, ubicacion || null]
        );

        res.status(201).json({
            success: true,
            mensaje: `Evento creado exitosamente con código ${codigo}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al crear evento',
            error: error.message
        });
    }
};

// Activar evento
const activarEvento = async (req, res) => {
    try {
        const { id } = req.params;

        // Desactivar todos los eventos activos
        await db.query(
            "UPDATE eventos SET estado = 'Inactivo' WHERE estado = 'Activo'"
        );

        // Activar el evento seleccionado
        await db.query(
            "UPDATE eventos SET estado = 'Activo' WHERE id = ?", [id]
        );

        res.json({
            success: true,
            mensaje: 'Evento activado exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al activar evento',
            error: error.message
        });
    }
};

// Finalizar evento
const finalizarEvento = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query(
            "UPDATE eventos SET estado = 'Finalizado' WHERE id = ?", [id]
        );

        res.json({
            success: true,
            mensaje: 'Evento finalizado exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al finalizar evento',
            error: error.message
        });
    }
};

// Editar evento
const editarEvento = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, fecha_inicio, fecha_fin, ubicacion } = req.body;

        await db.query(
            'UPDATE eventos SET nombre = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?, ubicacion = ? WHERE id = ?',
            [nombre, descripcion, fecha_inicio, fecha_fin, ubicacion || null, id]
        );

        res.json({
            success: true,
            mensaje: 'Evento actualizado exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al editar evento',
            error: error.message
        });
    }
};

// Reprogramar evento
const reprogramarEvento = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha_inicio, fecha_fin, descripcion } = req.body;

        await db.query(
            "UPDATE eventos SET estado = 'Reprogramado', fecha_inicio = ?, fecha_fin = ?, descripcion = ? WHERE id = ?",
            [fecha_inicio, fecha_fin, descripcion, id]
        );

        res.json({
            success: true,
            mensaje: 'Evento reprogramado exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al reprogramar evento',
            error: error.message
        });
    }
};

// Reabrir evento finalizado
const reabrirEvento = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el evento existe y está finalizado
        const [eventos] = await db.query(
            'SELECT * FROM eventos WHERE id = ?', [id]
        );

        if (eventos.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Evento no encontrado'
            });
        }

        if (eventos[0].estado !== 'Finalizado') {
            return res.status(400).json({
                success: false,
                mensaje: 'Solo se pueden reabrir eventos finalizados'
            });
        }

        // Cambiar estado a Inactivo para que pueda ser activado
        await db.query(
            "UPDATE eventos SET estado = 'Inactivo' WHERE id = ?", [id]
        );

        res.json({
            success: true,
            mensaje: 'Evento reabierto exitosamente. Ahora puedes activarlo.'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al reabrir evento'
        });
    }
};

module.exports = {
    obtenerEventos,
    obtenerEventoActivo,
    crearEvento,
    activarEvento,
    finalizarEvento,
    editarEvento,
    reprogramarEvento,
    reabrirEvento
};