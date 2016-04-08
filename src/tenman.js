// Polarbot
// tenman.js
// Extends commands

var app = require('./app.js');
var commands = require("./commands.js")
var config = require("./config/config.js");

// for 10mans
var players = [];
var team1 = [];
var team2 = [];

var cmds = [
    {
        cmd: "!addplayer",
        alias: "!addPlayers",
        execute: function(message) {
            if (commands.isAdmin(message)) {
                // copy players from options
                var opt = commands.splitCmd(message.content, 1);
                opt = opt.split(" ");
                opt.splice(opt.length - 1, 1);
                if (opt != undefined) {
                    for (var i = 0; i < opt.length; i++) {
                        players.push(opt[i]);
                    }
                    commands.sendMessage(message, "Player count: " + players.length + ".");
                }
            }
        }
    },
    {
        cmd: "!resetplayers",
        alias: "!resetPlayers",
        execute: function(message) {
            if (commands.isAdmin(message)) {
                // wipe players
                players = [];
                commands.sendMessage(message, "Players reset.");
            }
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
                        content += players[i] + " ";
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
                        var value = tmpPlayers.slice(random, random + 1);
                        if (done > 5) {
                            tmpTeam1.push(value);
                        } else {
                            tmpTeam2.push(value);
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
                    console.log(team1);
                    showTeams(message);
                } else {
                    commands.sendMessage(message, "Teams haven't been randomed.");
                }
            }
        }
    },
    {
        cmd: "!start",
        execute: function(message) {
            if (commands.isAdmin(message)) {
                if (players.length == 10 && team1.length == 5 && team2.length == 5) {
                    // get voice channel names (from config)
                    var channels = message.channel.server.channels;
                    var team1Channel = channels.get("name", config.team1);
                    var team2Channel = channels.get("name", config.team2);
                    
                    // check that channels are set and exist
                    if (team1Channel == undefined || team2Channel == undefined) {
                        commands.sendMessage(message, "Team channels not set (or not found), please set them in the config.");
                    } else {
                        // send start message, teams
                        commands.sendMessage(message, "Starting CS:GO 10-man. \nconnect polar.dy.fi; password apina");
                        
                        // get user-objects of players
                        var users = message.channel.server.members;
                        
                        for (var i = 0; i < players.length; i++) {
                            // Find current player from users
                            var curPlayer = users.get("username", players[i]);
                            if (curPlayer != undefined) {
                                // get player team
                                for (var j = 0; j < team1.length; j++) {
                                    if (curPlayer.username.toLowerCase() == team1[j].toLowerCase()) {
                                        // move player
                                        app.bot.moveMember(curPlayer, team1Channel);
                                        break;
                                    }
                                }
                                for (var j = 0; j < team2.length; j++) {
                                    if (curPlayer.username.toLowerCase() == team2[j].toLowerCase()) {
                                        // move player
                                        app.bot.moveMember(curPlayer, team2Channel);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                } else {
                    commands.sendMessage(message, "No players.");
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
