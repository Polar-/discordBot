// PolarBot
// app.js

var Discord = require("discord.js");
var bot = new Discord.Client();
var config = require("./config/config.js");
var commands = require("./commands.js");
var logger = require("./logger.js");

// Command listener
bot.on("message", function(message) {
    logger.logMessage(message);
	if (message.sender.username != bot.user.username) {
        commands.command(message);
	}
});

// Disconnect listener
bot.on("disconnected", function() {
    logger.log("Lost connection to server.");
});

// Reconnects every 15 seconds until login is succesful
function reconnect() {
    var reconnecting = setInterval(function() {
        if (login()) {
            logger.log("Logged in succesfully.")
            clearTimeout(reconnection);
        }
        else {
            logger.log("Reconnecting failed. Trying again in 30 seconds.");
        }
    }, 30);
}

// Function for logging in with information from config file
// Returns true if login was successful
function login(callback) {
    bot.login(config.discordUsername, config.discordPassword, function(error, token) {
        if (error) {
            logger.log("Couldn't connect to server :" + error)
            return callback(false);
        } else {
            return callback(true);
        }
    });
}

// Login bot
login(function(success) {
    if (!success) {
        reconnect();
    } else {
        logger.log("Logged in successfully.");
    }
});

// bot-getter
exports.bot = bot;