// PolarBot
// app.js

var Discord = require("discord.io");
var config = require("./config/config.js");
var commands = require("./commands.js");
var logger = require("./logger.js");

// Init bot
var bot = new Discord.Client({
    token: config.token,
    autorun: true
});

// Command listener
bot.on("message", function(user, userID, channelID, message, rawEvent) {
    logger.logMessage(message);
    var tmpMessage = {
        id: rawEvent.d.id,
        userID: userID,
        username: user,
        channelID: channelID,
        content: message
    };
	if (userID != bot.id) {
        commands.command(tmpMessage);
	}
});

bot.on('ready', function() {
    logger.log("Listening for commands...");
    commands.setApp(bot);
});




/*
// Disconnect listener
bot.on("disconnected", function() {
    logger.log("Lost connection to server. Reconnecting in " + config.reconnectInterval / 1000 + " seconds...");
    setTimeout(function() {
        logger.log("Attempting reconnection...");
        var reconnecting = setInterval(function() {
            login(function(success) {
                if (success) {
                    clearTimeout(reconnecting);
                }
                else {
                    logger.log("Reconnecting failed. Trying again in " + config.reconnectInterval / 1000 + " seconds.");
                }
            });
        }, config.reconnectInterval);
    }, config.reconnectInterval);
});

// Function for logging in with information from config file
// Returns true if login was successful
function login(callback) {
    bot.login(config.discordUsername, config.discordPassword, function(error, token) {
        if (error) {
            logger.log("Couldn't connect to server: " + error)
            return callback(false);
        } else {
            logger.log("Logged in successfully.");
            return callback(true);
        }
    });
}

// Login bot
login(function(success) {
    if (success) {
        logger.log("Listening for commands...");
    }
});*/

// bot-getter
exports.bot = bot;