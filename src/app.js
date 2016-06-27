// PolarBot
// app.js

var Discord = require("discord.io");
var config = require("./config/config.js");
var commands = require("./commands.js");
var logger = require("./logger.js");

// For setting avatar
//var fs = require("fs");

// Init bot
var bot = new Discord.Client({
    token: config.token,
    autorun: true
});

// Listen only after the bot is ready (logged in)
var listening = false;

// Command listener
bot.on("message", function(user, userID, channelID, message, rawEvent) {
    if (listening) {
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
        logger.logMessage(tmpMessage);
    }
});

bot.on('ready', function() {
    listening = true;
    logger.log("Listening for commands...");
    
    //////////////////////////////////////////////
    // set server-objects to a more usable form //
    //////////////////////////////////////////////
    
    // get server id's
    var tmpServers = [];
    var serverIDs = getProperties(bot.servers);

    // for each server
    for (var i = 0; i < serverIDs.length; i++) {
        var tmpServer = {};
        
        // SERVER INFORMATION
        tmpServer = serverInfo(bot.servers[serverIDs[i]]);
        
        // CHANNELS
        tmpServer.channels = [];
        var channelIDs = getProperties(bot.servers[serverIDs[i]].channels);
        
        // Generate channel-object from each channel
        for (var j = 0; j < channelIDs.length; j++) {
            var tmpChannel = channelInfo(bot.servers[serverIDs[i]].channels[channelIDs[j]])
            tmpServer.channels.push(tmpChannel);
        }
        
        // ROLES
        tmpServer.roles = [];
        var roleIDs = getProperties(bot.servers[serverIDs[i]].roles);
        
        // Generate role-object from each role
        for (var j = 0; j < roleIDs.length; j++) {
            var tmpRole = roleInfo(bot.servers[serverIDs[i]].roles[roleIDs[j]]);
            tmpServer.roles.push(tmpRole);
        }

        // MEMBERS
        tmpServer.members = [];
        var memberIDs = getProperties(bot.servers[serverIDs[i]].members);
        
        // Generate member-object from each member
        for (var j = 0; j < memberIDs.length; j++) {
            var tmpMember = memberInfo(bot.servers[serverIDs[i]].members[memberIDs[j]]);
            tmpServer.members.push(tmpMember);
        }
        
        // Push to tmpServers
        tmpServers.push(tmpServer);
    }
    
    // Set server properties
    bot.info = {};
    bot.info.servers = tmpServers;

    // Set bot avatar
    /*bot.editUserInfo({
        avatar: require('fs').readFileSync('./obesebot.png', 'base64')
    });*/
});

// Gets object properties
function getProperties(object) {
    var props = [];
    for (var prop in object) {
        props.push(prop);
    }
    
    return props;
}

// Returns basic server information -object
function serverInfo(server) {
    var tmpServer = {};
    tmpServer.id = server.id;
    tmpServer.name = server.name;
    tmpServer.region = server.region;
    tmpServer.ownerID = server.owner_id;
    
    return tmpServer;
}

// Returns a channel-object
function channelInfo(channel) {
    var tmpChannel = {};
    tmpChannel.id = channel.id;
    tmpChannel.name = channel.name;
    tmpChannel.type = channel.type;
    tmpChannel.serverID = channel.guild_id;
    
    return tmpChannel;
}

// Returns a role-object
function roleInfo(role) {
    var tmpRole = {};
    tmpRole.id = role.id;
    tmpRole.name = role.name;
    
    return tmpRole;
}

// Returns a member-object
function memberInfo(member) {
    var tmpMember = {};
    tmpMember.id = member.id;
    tmpMember.roles = member.roles;
    tmpMember.joinedAt = member.joined_at;
    
    return tmpMember;
}



// Disconnect listener
bot.on("disconnected", function() {
    logger.log("Lost connection to server. Reconnecting in " + config.reconnectInterval / 1000 + " seconds...");
    setTimeout(function() {
        logger.log("Attempting reconnection...");
        bot.connect();
    }, config.reconnectInterval);
});


// bot-getter
exports.bot = bot;