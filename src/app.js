// PolarBot
// app.js

var Discord = require("discord.js");
var bot = new Discord.Client();
var config = require("./config/config.js");
var commands = require("./commands.js");
var logger = require("./logger.js");

// Command listener
bot.on("message", function(message) {
    logger.log(message);
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
            console.log("Logged in succesfully.")
            clearTimeout(reconnection);
        }
        else {
            console.log("Reconnecting failed. Trying again in 15 seconds.");
        }
    }, 15000);
}

// Function for logging in with information from config file
// Returns true if login was successful
function login() {
    bot.login(config.discordUsername, config.discordPassword, function(error, token) {
        if (error) {
            console.log("Couldn't connect to server :" + error)
            return false;
        } else {
            return true;
        }
    });
}

// Login bot
if (!login()) {
    reconnect();
} else {
    console.log("Logged in successfully.");
}

// bot-getter
exports.bot = bot;