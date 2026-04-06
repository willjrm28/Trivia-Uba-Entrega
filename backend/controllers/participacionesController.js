const db = require('../config/database');

// Registrar participación
const registrarParticipacion = async (req, res) => {
    try {
        const { perfil, escuela, respuestas_correctas, respuestas_incorrectas } = req.body;

        const [eventos] = await db.query(
            "SELECT id FROM eventos WHERE estado = 'Activo' LIMIT 1"
        );

        if (eventos.length === 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'Lo sentimos, el sistema no está disponible temporalmente'
            });
        }

        const evento_id = eventos[0].id;

        await db.query(
            'INSERT INTO participaciones (evento_id, perfil, escuela, respuestas_correctas, respuestas_incorrectas) VALUES (?, ?, ?, ?, ?)',
            [evento_id, perfil, escuela || null, respuestas_correctas, respuestas_incorrectas]
        );

        res.status(201).json({
            success: true,
            mensaje: 'Participación registrada exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al registrar participación',
            error: error.message
        });
    }
};

const obtenerEstadisticas = async (req, res) => {
    try {
        const { evento_id, fecha } = req.query;

        // Construir filtros base
        let filtros = [];
        let params = [];

        if (evento_id) {
            filtros.push('p.evento_id = ?');
            params.push(evento_id);
        }
        if (fecha) {
            filtros.push('DATE(p.created_at) = ?');
            params.push(fecha);
        }

        const whereClause = filtros.length > 0 ? 'WHERE ' + filtros.join(' AND ') : '';

        // Total general
        const [totales] = await db.query(`
            SELECT COUNT(*) as total_participaciones,
                   SUM(CASE WHEN respuestas_correctas = 2 THEN 1 ELSE 0 END) as total_premios,
                   SUM(CASE WHEN respuestas_correctas = 1 THEN 1 ELSE 0 END) as total_parcial,
                   SUM(CASE WHEN respuestas_correctas = 0 THEN 1 ELSE 0 END) as total_cero
            FROM participaciones p
            ${whereClause}
        `, params);

        // Por perfil
        const [porPerfil] = await db.query(`
            SELECT perfil,
                   COUNT(*) as total,
                   SUM(CASE WHEN respuestas_correctas = 2 THEN 1 ELSE 0 END) as dos_correctas,
                   SUM(CASE WHEN respuestas_correctas = 1 THEN 1 ELSE 0 END) as una_correcta,
                   SUM(CASE WHEN respuestas_correctas = 0 THEN 1 ELSE 0 END) as cero_correctas,
                   ROUND(SUM(CASE WHEN respuestas_correctas = 2 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as porcentaje_premios
            FROM participaciones p
            ${whereClause}
            GROUP BY perfil
            ORDER BY total DESC
        `, params);

        // Por escuela (solo estudiantes)
        let filtrosEscuela = [...filtros, "p.perfil = 'Estudiante'"];
        let paramsEscuela = [...params];
        const whereEscuela = 'WHERE ' + filtrosEscuela.join(' AND ');

        const [porEscuela] = await db.query(`
            SELECT escuela,
                   COUNT(*) as total,
                   SUM(CASE WHEN respuestas_correctas = 2 THEN 1 ELSE 0 END) as dos_correctas,
                   SUM(CASE WHEN respuestas_correctas = 1 THEN 1 ELSE 0 END) as una_correcta,
                   SUM(CASE WHEN respuestas_correctas = 0 THEN 1 ELSE 0 END) as cero_correctas,
                   ROUND(SUM(CASE WHEN respuestas_correctas = 2 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as porcentaje_premios
            FROM participaciones p
            ${whereEscuela}
            GROUP BY escuela
            ORDER BY total DESC
        `, paramsEscuela);

        // Cultura organizacional (trabajadores + invitados)
        let filtrosCultura = [...filtros, "p.perfil IN ('Trabajador', 'Invitado')"];
        let paramsCultura = [...params];
        const whereCultura = 'WHERE ' + filtrosCultura.join(' AND ');

        const [cultura] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN respuestas_correctas = 2 THEN 1 ELSE 0 END) as premios,
                ROUND(SUM(CASE WHEN respuestas_correctas = 2 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as porcentaje
            FROM participaciones p
            ${whereCultura}
        `, paramsCultura);

        res.json({
            success: true,
            data: {
                totales: totales[0],
                por_perfil: porPerfil,
                por_escuela: porEscuela,
                cultura_organizacional: cultura[0]
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

// Obtener preguntas aleatorias según perfil
const obtenerPreguntasAleatorias = async (req, res) => {
    try {
        const { perfil, escuela } = req.query;

        let categoria;
        if (perfil === 'Estudiante') {
            categoria = 'Investigacion-Estudiantes';
        } else if (perfil === 'Profesor') {
            categoria = 'Investigacion-Profesores';
        } else if (perfil === 'Invitado') {
            categoria = 'Cultura-Invitados';
        } else {
            categoria = 'Cultura-UBA';
        }

        let query = `SELECT * FROM preguntas WHERE categoria = ? AND activa = 1`;
        let params = [categoria];

        if ((perfil === 'Estudiante' || perfil === 'Profesor') && escuela) {
            query += ' AND (escuela = ? OR escuela IS NULL)';
            params.push(escuela);
        }
        
        query += ' ORDER BY RAND() LIMIT 2';

        const [preguntas] = await db.query(query, params);

        if (preguntas.length < 2) {
            return res.status(400).json({
                success: false,
                mensaje: 'No hay suficientes preguntas disponibles'
            });
        }

        const preguntasConOpciones = await Promise.all(
            preguntas.map(async (pregunta) => {
                const [opciones] = await db.query(
                    'SELECT * FROM opciones WHERE pregunta_id = ? ORDER BY RAND()',
                    [pregunta.id]
                );
                return { ...pregunta, opciones };
            })
        );

        res.json({ success: true, data: preguntasConOpciones });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener preguntas',
            error: error.message
        });
    }
};

const obtenerMetricasPorDia = async (req, res) => {
    try {
        const { evento_id } = req.query;

        if (!evento_id) {
            return res.status(400).json({
                success: false,
                mensaje: 'evento_id es requerido'
            });
        }

        const [porDia] = await db.query(`
            SELECT 
                DATE(created_at) as fecha,
                COUNT(*) as total,
                SUM(CASE WHEN respuestas_correctas = 2 THEN 1 ELSE 0 END) as dos_correctas,
                SUM(CASE WHEN respuestas_correctas = 1 THEN 1 ELSE 0 END) as una_correcta,
                SUM(CASE WHEN respuestas_correctas = 0 THEN 1 ELSE 0 END) as cero_correctas,
                ROUND(SUM(CASE WHEN respuestas_correctas = 2 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as porcentaje_premios
            FROM participaciones
            WHERE evento_id = ?
            GROUP BY DATE(created_at)
            ORDER BY fecha ASC
        `, [evento_id]);

        res.json({ success: true, data: porDia });

    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener métricas por día',
            error: error.message
        });
    }
};

module.exports = {
    registrarParticipacion,
    obtenerEstadisticas,
    obtenerPreguntasAleatorias,
    obtenerMetricasPorDia
};