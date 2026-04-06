# Guía de Instalación — Trivia UBA

## Requisitos del servidor
- Node.js v18 o superior
- MySQL 5.7 o superior
- npm

---

## Paso 1 — Base de datos

1. Crear una base de datos en MySQL:
```sql
CREATE DATABASE trivia_uba;
```

2. Ejecutar el archivo de esquema ubicado en `/database/schema.sql`:
```bash
mysql -u usuario -p trivia_uba < database/schema.sql
```

---

## Paso 2 — Configurar el backend

Editar el archivo `/backend/.env` con los datos reales del servidor:
```
DB_HOST=localhost
DB_USER=usuario_mysql
DB_PASSWORD=password_mysql
DB_NAME=trivia_uba
PORT=3000
```

---

## Paso 3 — Instalar dependencias del backend

Desde la terminal, entrar a la carpeta `/backend` y ejecutar:
```bash
cd backend
npm install
```

---

## Paso 4 — Configurar la URL del frontend

Editar el archivo `/frontend/js/config.js` y reemplazar la URL con la dirección real del servidor:
```js
const CONFIG = {
    BASE_URL: 'http://dominio-del-servidor.com/api'
};
```

También editar `/frontend/admin/js/config.js` con la misma URL.

---

## Paso 5 — Iniciar el servidor

Desde la carpeta `/backend` ejecutar:
```bash
node serve.js
```

Para mantener el servidor activo en producción, se recomienda usar PM2:
```bash
npm install -g pm2
pm2 start serve.js --name trivia-uba
pm2 save
```

---

## Paso 6 — Servir el frontend

El frontend es estático (HTML/CSS/JS). Puede servirse de dos formas:

**Opción A — Con el mismo servidor Node.js** (ya configurado en serve.js)
No requiere configuración adicional.

**Opción B — Con Apache o Nginx**
Apuntar el directorio raíz al servidor al contenido de la carpeta `/frontend`.

---

## Estructura de carpetas
```
trivia-uba/
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── config/
│   ├── middlewares/
│   ├── .env          ← editar con datos reales
│   ├── serve.js
│   └── package.json
├── frontend/
│   ├── admin/
│   │   └── js/
│   │       └── config.js   ← editar con URL real
│   ├── js/
│   │   └── config.js       ← editar con URL real
│   └── index.html
└── database/
    └── schema.sql    ← ejecutar una sola vez
```

---

## Resumen de archivos a editar

| Archivo | Qué cambiar |
|---|---|
| `/backend/.env` | Credenciales de base de datos y puerto |
| `/frontend/js/config.js` | URL del servidor |
| `/frontend/admin/js/config.js` | URL del servidor |