const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Login de administrador
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar administrador por email
        const [admins] = await db.query(
            'SELECT * FROM administradores WHERE email = ?', [email]
        );

        if (admins.length === 0) {
            return res.status(401).json({
                success: false,
                mensaje: 'Usuario o contraseña incorrectos'
            });
        }

        const admin = admins[0];

        // Verificar contraseña
        const passwordValida = await bcrypt.compare(password, admin.password);

        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                mensaje: 'Usuario o contraseña incorrectos'
            });
        }

        // Generar token JWT
        const token = jwt.sign(
            { id: admin.id, nombre: admin.nombre, email: admin.email },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Registrar log
        await db.query(
            'INSERT INTO logs (administrador_id, accion, detalle) VALUES (?, ?, ?)',
            [admin.id, 'Login', `Inicio de sesión exitoso`]
        );

        res.json({
            success: true,
            mensaje: 'Login exitoso',
            token,
            admin: {
                id: admin.id,
                nombre: admin.nombre,
                email: admin.email
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error en el servidor',
            error: error.message
        });
    }
};

// Crear administrador inicial
const crearAdmin = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        // Verificar si ya existe
        const [existe] = await db.query(
            'SELECT id FROM administradores WHERE email = ?', [email]
        );

        if (existe.length > 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'Ya existe un administrador con ese email'
            });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(password, salt);

        await db.query(
            'INSERT INTO administradores (nombre, email, password) VALUES (?, ?, ?)',
            [nombre, email, passwordEncriptada]
        );

        res.status(201).json({
            success: true,
            mensaje: 'Administrador creado exitosamente'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al crear administrador',
            error: error.message
        });
    }
};

// Cambiar contraseña
const cambiarPassword = async (req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body;
        const adminId = req.admin.id;

        const [admins] = await db.query(
            'SELECT * FROM administradores WHERE id = ?', [adminId]
        );

        const admin = admins[0];

        // Verificar contraseña actual
        const passwordValida = await bcrypt.compare(passwordActual, admin.password);

        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                mensaje: 'La contraseña actual es incorrecta'
            });
        }

        // Encriptar nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(passwordNueva, salt);

        await db.query(
            'UPDATE administradores SET password = ? WHERE id = ?',
            [passwordEncriptada, adminId]
        );

        // Registrar log
        await db.query(
            'INSERT INTO logs (administrador_id, accion, detalle) VALUES (?, ?, ?)',
            [adminId, 'Cambio de contraseña', 'Contraseña actualizada exitosamente']
        );

        res.json({
            success: true,
            mensaje: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al cambiar contraseña',
            error: error.message
        });
    }
};

module.exports = {
    login,
    crearAdmin,
    cambiarPassword
};