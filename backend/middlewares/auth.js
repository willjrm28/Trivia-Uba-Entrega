const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const verificarToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({
            success: false,
            mensaje: 'Acceso denegado. Token no proporcionado'
        });
    }

    try {
        const tokenLimpio = token.replace('Bearer ', '');
        const decoded = jwt.verify(tokenLimpio, process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            mensaje: 'Token inválido o expirado'
        });
    }
};

module.exports = verificarToken;