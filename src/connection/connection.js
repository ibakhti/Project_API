const mysql = require('mysql')

const conn = mysql.createConnection({
    user: 'bakhti',
    password: 'Dindabakhti0613',
    host: 'localhost',
    database: 'project_app',
    port: '3306'
})

module.exports = conn