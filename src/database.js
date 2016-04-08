// Polarbot
// database.js
// handles database connection and queries

var mysql = require('mysql');
var config = require('./config/config.js');
var logger = require('./logger.js');

// Init MySql-connection
var pool = mysql.createPool({
    host     : config.dbHost,
    port     : config.dbPort,
    user     : config.dbUser,
    password : config.dbPassword,
    database : config.dbDatabase
});

exports.query = function(qry, callback, esc) {
    // get new connection from pool
    connect(function(err, connection) {
        // execute query
         connection.query(qry, esc, function(err, rows) {
                connection.release();
                if (err) {
                    logger.log('MYSQL ERROR: ' + err);
                }
                callback(err, rows);
         });
    });
}

function connect(callback) {
    pool.getConnection(function(err, connection) {
        if (err) {
            logger.log('MYSQL Error getting connection from pool: ' + err);
        }
        else return callback(err, connection);
    });
}