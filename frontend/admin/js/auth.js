// Guardar token al hacer login
const guardarToken = (token, admin) => {
    localStorage.setItem('token', token);
    localStorage.setItem('admin', JSON.stringify(admin));
};

// Obtener token
const obtenerToken = () => {
    return localStorage.getItem('token');
};

// Obtener datos del admin
const obtenerAdmin = () => {
    const admin = localStorage.getItem('admin');
    return admin ? JSON.parse(admin) : null;
};

// Verificar si está autenticado
const estaAutenticado = () => {
    return obtenerToken() !== null;
};

// Cerrar sesión
const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    window.location.href = 'login.html';
};

// Proteger página (llamar al inicio de cada página admin)
const protegerPagina = () => {
    if (!estaAutenticado()) {
        window.location.href = 'login.html';
    }
};