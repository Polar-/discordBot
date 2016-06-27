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

// Load default league
var defaultLeague;
fs.readFile("./poe/defaultLeague.json", { encoding: "utf8" }, function(err, file) {
    if (err) {
        defaultLeague = undefined;
        logger.log("Error reading defaultLeague: " + err)
    } else {
        defaultLeague = file;
    }
});

// Load unique item JSON
var accessories = fs.readFileSync("./poe/uniques/accessories.json");
var armours = fs.readFileSync("./poe/uniques/armours.json");
var flasks = fs.readFileSync("./poe/uniques/flasks.json");
var jewels = fs.readFileSync("./poe/uniques/jewels.json");
var maps = fs.readFileSync("./poe/uniques/maps.json");
var weapons = fs.readFileSync("./poe/uniques/weapons.json");

var uniques = [];

// Parse from json
uniques.push(JSON.parse(accessories));
uniques.push(JSON.parse(armours));
uniques.push(JSON.parse(flasks));
uniques.push(JSON.parse(jewels));
uniques.push(JSON.parse(maps));
uniques.push(JSON.parse(weapons));

var cmds = [
    {
        cmd: "!item",
        alias: "!i",
        help: "Searches for unique item. Usage: !item (text) <itemName>. Use text-type to get item info as text.",
        execute: function(message) {
            var result;
            var search;
            var mode = commands.getCmd(message.content, 1);
            // !item text bramblejack returns item in text mode
            if (mode == "text" || mode == "t") {
                search = commands.splitCmd(message.content, 2);
                console.log(search);
            } else {
                mode = undefined;
                search = commands.splitCmd(message.content, 1)
            }
                        
            // Verify that leaguename and charname are not undefined
            if (search) {
                // Search for item in files' item-names
                var result;
                
                // Look for match in name (includes)
                for (var i = 0; i < uniques.length; i++) {
                    result = searchUnique(uniques[i], search);
                    if (result) {
                        break;
                    }
                }
                
                if (result) {
                    var err;
                    if (!mode) {
                        app.bot.uploadFile({
                            to: message.channelID,
                            file: "./poe/uniques/images/" + toFileName(result.name) + ".png",
                            filename: toFileName(result.name) + ".png",
                            message: ""
                        }, function(error, response) {
                            if (!error) {
                                commands.markForDeletion(response.id, response.channel_id);
                                commands.markForDeletion(message.id, message.channelID);
                                return; 
                            } else {
                                console.log(error);
                                logger.log("Error in unique item image uploading: " + error);
                            }
                        });
                    } else {
                        // Format response
                        var response = "```\n";
                        response = addBasic(result, response);
                        response = addDef(result.defenses, response);
                        response = addOff(result, response);
                        response = addReq(result.requirements, response);
                        response = addImplicit(result.mods.implicit, response);
                        response = addExplicit(result.mods.explicit, response);
                        response += "\n```";
                        
                        // Send item info as response
                        commands.sendMessage(message, response, null, 4); 
                    }   
                } else {
                    commands.sendMessage(message, "Couldn't find an item with that name.");
                }

            } else {
                commands.sendMessage(message, this.help);
            }
        }
    },
    {
        cmd: "!setdefaultleague",
        alias: "!defleague",
        help: "Sorry, that command is only available to admins.",
        execute: function(message) {
            if (commands.isAdmin(message)) {
                var val = commands.splitCmd(message.content, 1)
                if (val) {
                    fs.writeFile("./poe/defaultLeague.json", val, function(err) {
                        if (err) {
                            logger.log(err);
                            commands.sendMessage(message, "Error saving defaultLeague. See logs for details.");
                        } else {
                            defaultLeague = val;
                            commands.sendMessage(message, "Set default league to " +  val);
                        }
                    });
                } else {
                    commands.sendMessage(message, "Invalid command. Please give a league.");
                }
            } else {
                commands.sendMessage(message, this.help);
            }
        }
    },
    {
        cmd: "!poeladder",
        alias: "!poerank",
        help: "Shows the ladder rank of character in league. Usage: !poeladder <charactername> <league(optional)>.",
        execute: function(message) {
            var leaguename = commands.getCmd(message.content, 2);
            var charname = commands.getCmd(message.content, 1);
            
            // Set league to default is none is given
            if (!leaguename) { leaguename = defaultLeague };
            
            // Verify that charname is not undefined
            if (charname) {
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
                commands.sendMessage(message, this.help + " Default league is set to " + defaultLeague + ".");
            }
        }
    },
    {
        cmd: "!skillgem",
        alias: "!gem",
        help: "Shows a skill gem's availability. Usage !poegem <skillGemName>.",
        execute: function(message) {
             var gemName = commands.splitCmd(message.content, 1);
             if (gemName) {
                 var gem;
                 // Find skill gem from skillgem.json
                 for (var i = 0; i < skillgem.length; i++) {
                     if (skillgem[i].name.toLowerCase().includes(gemName.toLowerCase())) {
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

// Formats unique name to filename
function toFileName(name) {
    // Replace spaces with underscores
    name = name.replace(/\s/g, "_");
    return name;
}

// Searches for search-string in item.names
function searchUnique(items, search) {
    var result;
    for (var i = 0; i < items.length; i++) {
        if (
            formatSearch(items[i].name.toLowerCase()).includes(search) ||
            items[i].name.toLowerCase().includes(search)
        ) {
            result = items[i];
            break; // Break on match
        }
    }
    return result;
}

// Adds basic information (name, base item)
function addBasic(item, text) {
    text += 
        item.name + "\n" + 
        item.baseItem;
    return text;
}

// Adds requirements (lvl, str, dex, int) if they are present
function addReq(req, text) {
    if (!req) { return text };
    if (req.level == 0 && req.str == 0 && req.dex == 0 && req.int == 0) { return text; }
    text += "\n----------------------------------------";
    text += "\nRequires: ";
    if (req.level > 0) {
        text += "Level " + req.level + "   ";
    }
    if (req.str > 0) {
        text += req.str + " str   ";
    }
    if (req.dex > 0) {
        text += req.dex + " dex   ";
    }
    if (req.int > 0) {
        text += req.int + " int   ";
    }

    return text;
}

// Adds offensive values (crit, damage, aps)
function addOff(item, text) {
    if (!item.damage && !item.aps && !item.crit) { return text };
    text += "\n----------------------------------------";
    if (item.damage) {
        text += "\n" + item.damage;
    }
    if (item.crit) {
        text += "Crit: " + item.crit;
    }
    if (item.aps) {
        text += "\nAPS: " + item.aps;
    }
    return text;
}

// Adds defensive values (armor, evasion, energy shield, block)
function addDef(def, text) {
    if (!def) { return text };
    if (def.block == 0 && def.armour == 0 && def.evasion == 0 && def.energy == 0) { return text };
    text += "\n----------------------------------------";
    if (def.armour != 0) {
        text += "\nArmour: " + def.armour;
    }
    if (def.evasion != 0) {
        text += "\nEvasion: " + def.evasion;
    }
    if (def.energy != 0) {
        text += "\nEnergy Shield: " + def.energy;
    }
    if (def.block != 0) {
        text += "\nBlock: " + def.block;
    }
    return text;
}

// Adds implicit mods if they are present
function addImplicit(mods, text) {
    if (!mods) { return text };
    if (mods == "") {
        return text;
    } 
    text += "\n----------------------------------------\n";
    text += mods;
    return text;
}

// Adds explicit mods if they are present
function addExplicit(mods, text) {
    if (!mods) { return text };
    if (mods == "") {
        return text;
    }
    text += "\n----------------------------------------\n";
    text += mods;
    return text;
}

// Formats string in to a more "searchable" form
function formatSearch(value) {
    value = value.replace("'", "");
    return value;
}

// Export commands
module.exports = cmds;
