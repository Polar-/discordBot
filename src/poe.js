// Polarbot
// poe.js
// Extends commands

var app = require('./app.js');
var commands = require("./commands.js");
var request = require("request");
var logger = require("./logger.js");

var cmds = [
    {
        cmd: "!poeladder",
        alias: "!poeLadder",
        help: "Shows the ladder rank of character in league. Usage: !poeladder <league> <charactername>.",
        execute: function(message) {
            var leaguename = commands.getCmd(message.content, 1);
            var charname = commands.getCmd(message.content, 2);
            // Verify that leaguename and charname are not undefined
            if (leaguename && charname) {
                // Init url
                var url = "http://api.exiletools.com/ladder?league=" + 
                    leaguename + "&charName=" + charname;
                // Get request with node-request
                logger.log("Requesting exiletools api.. ");
                request.get(url, function(error, response, body) {
                    logger.log("Got response code: " + response.statusCode);
                    try {
                        body = JSON.parse(body);
                    } catch (e) {
                        body = undefined;
                        commands.sendMessage(message, "Character or league not found.");
                    }
                    if (body) {
                        // Get object-key (account.charname)
                        var objKey = Object.keys(body)[0];
                        
                        // Get alive state
                        var alive = true;
                        if (body[objKey].dead == 1) {
                            alive = false;
                        }
                        
                        // Generate information-string
                        var info = charname + ", level " + body[objKey].level + 
                            " " + body[objKey].class;
                        if (!alive) {
                            info += " (DEAD)";
                        }
                        info += "\n" +  
                                "League: " + leaguename + "\n" + 
                                "Ladder rank: " + body[objKey].rank;
                        
                        // Send information as respone
                        commands.sendMessage(message, info); 
                    }
                });
            } else {
                commands.sendMessage(message, this.help);
            }
        }
    }
];

module.exports = cmds;
