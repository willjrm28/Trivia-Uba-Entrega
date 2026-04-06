-- Base de datos: trivia_uba
-- Sistema de Trivia Educativa - Universidad Bicentenaria de Aragua

CREATE TABLE administradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    ubicacion VARCHAR(200),
    estado ENUM('Activo', 'Inactivo', 'Finalizado') DEFAULT 'Inactivo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE preguntas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    texto TEXT NOT NULL,
    categoria ENUM('Investigacion-Estudiantes', 'Investigacion-Profesores', 'Cultura-UBA') NOT NULL,
    escuela ENUM('Derecho', 'Ingenieria-Sistemas', 'Ingenieria-Electrica', 'Psicologia', 'Administracion', 'Comunicacion-Social'),
    activa TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE opciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pregunta_id INT NOT NULL,
    texto VARCHAR(255) NOT NULL,
    es_correcta TINYINT(1) DEFAULT 0,
    FOREIGN KEY (pregunta_id) REFERENCES preguntas(id) ON DELETE CASCADE
);

CREATE TABLE participaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT NOT NULL,
    perfil ENUM('Estudiante', 'Profesor', 'Trabajador', 'Invitado') NOT NULL,
    escuela ENUM('Derecho', 'Ingenieria-Sistemas', 'Ingenieria-Electrica', 'Psicologia', 'Administracion', 'Comunicacion-Social'),
    respuestas_correctas TINYINT NOT NULL DEFAULT 0,
    respuestas_incorrectas TINYINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evento_id) REFERENCES eventos(id)
);

CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    administrador_id INT NOT NULL,
    accion VARCHAR(100) NOT NULL,
    detalle TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (administrador_id) REFERENCES administradores(id)
);