const mysql2 = require('mysql2');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = mysql2.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'trivia_uba',
    waitForConnections: true,
    connectionLimit: 10,
});

const promisePool = pool.promise();

module.exports = promisePool;