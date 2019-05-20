const mysql = require('mysql')

const conn = mysql.createConnection({
    user: 'root',
    password: 'Ilham_bakhti0613',
    host: 'localhost',
    database: 'project_db',
    port: '3306'
})

module.exports = conn