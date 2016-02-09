// PolarBot
// app.js

var Discord = require("discord.js");
var bot = new Discord.Client();
var config = require("./config/config.js");
var commands = require("./commands.js");
var logger = require("./logger.js");

// Command listener
bot.on("message", function(message){
    logger.log(message);
	if (message.sender.username != bot.user.username) {
        commands.command(message);
	}
});

// bot-getter
exports.bot = bot;

bot.login(config.discordUsername, config.discordPassword, function(error, token) {
    if (error) console.log(error);
});