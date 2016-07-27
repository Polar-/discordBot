// Polarbot
// tenman.js
// Extends commands

var app = require('./app.js');
var commands = require("./commands.js");
var config = require("./config/config.js");
var logger = require("./logger.js");

// for 10mans
var players = [];
var team1 = [];
var team2 = [];

var cmds = [
    {
        cmd: "!addplayer",
        alias: "!addplayers",
        execute: function(message) {
            if (commands.isAdmin(message)) {
                // copy players from options
                var opt = commands.splitCmd(message.content, 1);

                opt = opt.split(" ");
                if (opt.length > 1) {
                    opt.splice(opt.length, 1);
                }
                
                if (opt != undefined) {
                    for (var i = 0; i < opt.length; i++) {
                        players.push({ name: opt[i] });
                    }
                    commands.sendMessage(message, "Player count: " + players.length + ".");
                }
            }
        }
    },
    {
        cmd: "!resetplayers",
        alias: "!resetteams",
        execute: function(message) {
            if (!commands.isAdmin(message)) { return; };
            // wipe players
            players = [];
            commands.sendMessage(message, "Players reset.");
        }
    },
    {
        cmd: '!players',
        execute: function(message) {
            if (commands.isAdmin(message)) {
                // print current players
                if (players != undefined && players.length != 0) {
                    var content = "";
                    for (var i = 0; i < players.length; i++) {
                        content += players[i].name + " ";
                    }
                    commands.sendMessage(message, "Current players (" + players.length + "): " + content);
                } else {
                    commands.sendMessage(message, "No players.");
                }
            }
        }
    },
    {
        cmd: '!randomteams',
        execute: function(message) {
            if (commands.isAdmin(message)) {
                if (players != undefined && players.length == 10) {
                    // generate random teams
                    var tmpPlayers = players.slice();
                    var tmpTeam1 = [];
                    var tmpTeam2 = [];
                    var done = 1;

                    
                    // random teams
                    while (tmpPlayers.length > 0) {
                        var random = Math.floor(Math.random() * tmpPlayers.length);
                        var value = tmpPlayers.slice(random, random + 1)[0];
                        
                        if (done > 5) {
                            tmpTeam1.push(value.name);
                        } else {
                            tmpTeam2.push(value.name);
                        }
                        tmpPlayers.splice(random, 1);
                        done++;
                    }
                    team1 = tmpTeam1;
                    team2 = tmpTeam2;
                    showTeams(message);
                } else {
                    commands.sendMessage(message, "Not enough players.");
                }
            }
        }
    },
    {
        cmd: '!teams',
        execute: function(message) {
            if (commands.isAdmin(message)) {
                if (team1.length > 0 && players.length != 0) {
                    showTeams(message);
                } else {
                    commands.sendMessage(message, "Teams haven't been randomized.");
                }
            }
        }
    },
    {
        cmd: "!start",
        execute: function(message) {
            // Moves players to voice channels (only works if player is connected to a voice channel) 
            if (!commands.isAdmin(message)) { return; }
            if (players.length != 10 || team1.length != 5 || team2.length != 5) {
                commands.sendMessage(message, "No players.");
                return;
            }
            // Get ID's for all players
            for (var i = 0; i < players.length; i++) {
                for (var user in app.bot.users) {
                    if (app.bot.users[user].username.toLowerCase() == players[i].name.toLowerCase()) {
                        players[i].id = app.bot.users[user].id;
                    }
                }
            }
            // Init server/channel -variables
            var srv;
            var ch1;
            var ch2;


            // Get server the command was sent in 
            for (var i = 0; i < app.bot.info.servers.length; i++) {
                for (var j = 0; j < app.bot.info.servers[i].channels.length; j++) {
                    if (app.bot.info.servers[i].channels[j].id == message.channelID) {
                        srv = app.bot.info.servers[i];
                    }
                }
            }

            // Return if server was not found
            if (srv == undefined) { return; }

            //get channels
            for (var i = 0; i < srv.channels.length; i++) {
                if (srv.channels[i].name == config.team1) {
                    ch1 = srv.channels[i].id;
                } else
                if (srv.channels[i].name == config.team2) {
                    ch2 = srv.channels[i].id;
                }
            }
            
            // Return if either channel was not found
            if (ch1 == undefined || ch2 == undefined) { return; }

            // check that channels are set and exist
            if (config.team1 == undefined || config.team2 == undefined) {
                commands.sendMessage(message, "Team channels not set (or not found), please set them in the config.");
                return;
            }
            // send start message, teams
            commands.sendMessage(message, "Starting CS:GO 10-man. \nconnect polar.dy.fi; password apina");
            
            for (var i = 0; i < players.length; i++) {
                // Find current player from users
                // get player team
                for (var j = 0; j < team1.length; j++) {
                    if (players[i].name.toLowerCase() == team1[j].toLowerCase()) {
                        // move player
                        console.log("serv: " + srv.id)
                        console.log("ch: " + ch1)
                        console.log("user: " + players[i].id)
                        app.bot.moveUserTo({
                            serverID: srv.id,
                            channelID: ch1,
                            userID: players[i].id,
                        });
                        break;
                    }
                }
                for (var j = 0; j < team2.length; j++) {
                    if (players[i].name.toLowerCase() == team2[j].toLowerCase()) {
                        // move player
                        console.log("serv: " + srv.id)
                        console.log("ch: " + ch1)
                        console.log("user: " + players[i].id)
                        app.bot.moveUserTo({
                            serverID: srv.id,
                            channelID: ch2,
                            userID: players[i].id,
                        }, function(error) {
                            if (error) {
                                logger.log("Error moving user: " + error.message)
                            }
                        });
                        break;
                    }
                }
            }
        }
    }
];

function showTeams(message) {
    // print players
    // team1
    var content = "";
    content += "Team1: \n";
    for (var i = 0; i < team1.length; i++) {
        content += team1[i] + " ";
    }
    content += "\n\n";
    
    // team2
    content += "Team2: \n";
    for (var i = 0; i < team2.length; i++) {
        content += team2[i] + " ";
    }
    content += "\n";
    commands.sendMessage(message, content);
}

module.exports = cmds;
