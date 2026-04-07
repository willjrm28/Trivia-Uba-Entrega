const db = require('../config/database');

const obtenerPreguntas = async (req, res) => {
    try {
        const { evento_id, categoria, escuela } = req.query;

        let query = 'SELECT * FROM preguntas WHERE 1=1';
        let params = [];

        if (evento_id) {
            query += ' AND evento_id = ?';
            params.push(evento_id);
        }
        if (categoria) {
            query += ' AND categoria = ?';
            params.push(categoria);
        }
        if (escuela) {
            query += ' AND escuela = ?';
            params.push(escuela);
        }

        query += ' ORDER BY created_at DESC';

        const [preguntas] = await db.query(query, params);
        res.json({ success: true, data: preguntas });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al obtener preguntas', error: error.message });
    }
};

const obtenerPreguntasPorCategoria = async (req, res) => {
    try {
        const { categoria, escuela } = req.query;

        // 1. Buscamos automáticamente el ID del evento que tiene el estado 'Activo'
        const [eventosActivos] = await db.query("SELECT id FROM eventos WHERE estado = 'Activo' LIMIT 1");

        // Si no hay ningún evento activo configurado en la base de datos, detenemos la búsqueda
        if (eventosActivos.length === 0) {
            return res.json({ 
                success: true, 
                total: 0, 
                data: [], 
                mensaje: 'No hay eventos activos en este momento.' 
            });
        }

        // Guardamos el ID de ese evento (en el caso de tu captura, guardaría el ID 3)
        const idEventoActivo = eventosActivos[0].id;

        // 2. Buscamos las preguntas, exigiendo que coincidan con el idEventoActivo
        let query = 'SELECT * FROM preguntas WHERE activa = 1 AND evento_id = ?';
        let params = [idEventoActivo];

        // Añadimos los filtros extra si vienen en la petición (como la escuela)
        if (categoria) { 
            query += ' AND categoria = ?'; 
            params.push(categoria); 
        }
        if (escuela) { 
            query += ' AND escuela = ?'; 
            params.push(escuela); 
        }

        // Ejecutamos la consulta final
        const [preguntas] = await db.query(query, params);
        
        res.json({ success: true, total: preguntas.length, data: preguntas });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al obtener preguntas', error: error.message });
    }
};

const crearPregunta = async (req, res) => {
    try {
        const { texto, categoria, escuela, opciones, evento_id } = req.body;

        const [resultado] = await db.query(
            'INSERT INTO preguntas (evento_id, texto, categoria, escuela) VALUES (?, ?, ?, ?)',
            [evento_id || null, texto, categoria, escuela || null]
        );

        const preguntaId = resultado.insertId;

        for (const opcion of opciones) {
            await db.query(
                'INSERT INTO opciones (pregunta_id, texto, es_correcta) VALUES (?, ?, ?)',
                [preguntaId, opcion.texto, opcion.es_correcta]
            );
        }

        res.status(201).json({ success: true, mensaje: 'Pregunta creada exitosamente', id: preguntaId });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al crear pregunta', error: error.message });
    }
};

const editarPregunta = async (req, res) => {
    try {
        const { id } = req.params;
        const { texto, categoria, escuela, opciones, evento_id } = req.body;

        await db.query(
            'UPDATE preguntas SET evento_id = ?, texto = ?, categoria = ?, escuela = ? WHERE id = ?',
            [evento_id || null, texto, categoria, escuela || null, id]
        );

        if (opciones && opciones.length === 4) {
            for (const opcion of opciones) {
                await db.query(
                    'UPDATE opciones SET texto = ?, es_correcta = ? WHERE id = ?',
                    [opcion.texto, opcion.es_correcta, opcion.id]
                );
            }
        }

        res.json({ success: true, mensaje: 'Pregunta actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al editar pregunta', error: error.message });
    }
};

const eliminarPregunta = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM preguntas WHERE id = ?', [id]);
        res.json({ success: true, mensaje: 'Pregunta eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al eliminar pregunta', error: error.message });
    }
};

const obtenerOpciones = async (req, res) => {
    try {
        const { id } = req.params;
        const [opciones] = await db.query(
            'SELECT * FROM opciones WHERE pregunta_id = ? ORDER BY id ASC',
            [id]
        );
        res.json({ success: true, data: opciones });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al obtener opciones' });
    }
};

module.exports = {
    obtenerPreguntas,
    obtenerPreguntasPorCategoria,
    crearPregunta,
    editarPregunta,
    eliminarPregunta,
    obtenerOpciones
};
