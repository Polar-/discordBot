// Polarbot
// poe.js
// Extends commands

var app = require('./app.js');
var fs = require('fs');
var commands = require("./commands.js");
var request = require("request");
var logger = require("./logger.js");

// Load skillgem.json - skill gem information file
var skillgem = fs.readFileSync("./poe/skillgem.json");
skillgem = JSON.parse(skillgem);

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
                        
                        url = "http://api.exiletools.com/class-rank?league=" + 
                        leaguename + "&charName=" + charname + "&format=json";
                        
                        request.get(url, function(error, response, body) { 
                            console.log(body);
                            if (body != "{}" && body[key]) {
                                body = JSON.parse(body);
                                var key = Object.keys(body)[0];
                                info += "\nClass Rank: " + body[key].total;
                            }
                            // Send information as respond
                            commands.sendMessage(message, info); 
                        });
                    }
                });
            } else {
                commands.sendMessage(message, this.help);
            }
        }
    },
    {
        cmd: "!poegem",
        alias: "!skillgem",
        help: "Shows a skill gem's availability. Usage !poegem <skillGemName>.",
        execute: function(message) {
             var gemName = commands.splitCmd(message.content, 1);
             if (gemName) {
                 var gem;
                 // Find skill gem from skillgem.json
                 for (var i = 0; i < skillgem.length; i++) {
                     if (skillgem[i].name.toLowerCase() == gemName.toLowerCase()) {
                         // Break loop on match
                         
                         gem = skillgem[i];
                         break;
                     }
                 }
                 
                 if (!gem) {
                     commands.sendMessage(message, "Skill gem not found. Either I'm outdated or you can't write. (Gem info updated: 16.05.2016).");
                 } else {
                    // Generate content for response message
                    var content = gem.name + " [" + gem.color + "]\n" +
                        "Required lvl: " + gem.required_lvl + "\n";
                    
                    if (!gem.isVaal && gem.npc) {
                        content += "Quest: " + gem.quest_name + "\n" + 
                        "NPC: " + gem.npc + ", " + gem.town + " (Act " + gem.act + ")\n";
                    } else {
                        content += "Drop only gem.\n";
                    }
                    
                    // Add class availability if gem is not vaal gem and is not drop only
                    if (!gem.isVaal && gem.available_to.length > 0) {
                        content += "Available to: "; 
                        for (var i = 0; i < gem.available_to.length; i++) {
                            content += gem.available_to[i] + " ";
                        }
                    }
                    
                    // Send response
                    commands.sendMessage(message, content);
                 }
                 
             } else {
                 commands.sendMessage(message, help);
             }
        }
    }
];

module.exports = cmds;
