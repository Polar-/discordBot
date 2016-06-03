// EDIT THIS FILE WITH YOUR INFORMATION AND MOVE TO /src/config/config.js

var config = {};

// Discord account credentials
config.token = "yourDiscordBotTokenHere"

// Admin role name (for some commands requiring permissions)
config.adminRoleName = "admin";

// Default command and message deletion time in minutes
config.defaultDeletionTime = 15;

// Database connection information
config.dbHost = 'dbHost';
config.dbUser = 'dbUser';
config.dbPassword = 'dbPassword';
config.dbDatabase = 'dbDatabaseName';

// Reconnection interval
config.reconnectInterval = 10000;

module.exports = config;
