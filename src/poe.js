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

// Parse from json
accessories = JSON.parse(accessories);
armours = JSON.parse(armours);
flasks = JSON.parse(flasks);
jewels = JSON.parse(jewels);
maps = JSON.parse(maps);
weapons = JSON.parse(weapons);

var cmds = [
    {
        cmd: "!item",
        alias: "!unique",
        help: "Searches for unique item. Usage: !item <itemName>.",
        execute: function(message) {
            var search = commands.splitCmd(message.content, 1);
            // Verify that leaguename and charname are not undefined
            if (search) {
                // Search for item in files' item-names
                var type;
                var result;
                
                // Look for match in name (includes)
                // Accessories - quivers, belts, amulets, rings
                for (var i = 0; i < accessories.length; i++) {
                    if (
                        formatSearch(accessories[i].name.toLowerCase()).includes(search) ||
                        accessories[i].name.toLowerCase().includes(search)
                    ) {
                        type = "accessory";
                        result = accessories[i];
                        break; // Break on match
                    }
                }
                
                // Armours - body, helmet, gloves, boots, shields
                if (!result) {
                    for (var i = 0; i < armours.length; i++) {
                        if (
                            formatSearch(armours[i].name.toLowerCase()).includes(search) ||
                            armours[i].name.toLowerCase().includes(search)
                        ) {
                            type = "armour";
                            result = armours[i];
                            break; // Break on match
                        }
                    }
                }
                
                // Weapons - swords, axes, maces, staves, wands, sceptres, daggers
                if (!result) {
                    for (var i = 0; i < weapons.length; i++) {
                        if (
                            formatSearch(weapons[i].name.toLowerCase()).includes(search) ||
                            weapons[i].name.toLowerCase().includes(search)
                        ) {
                            type = "weapon";
                            result = weapons[i];
                            break; // Break on match
                        }
                    }
                }
                
                // Flasks 
                if (!result) {
                    for (var i = 0; i < flasks.length; i++) {
                        if (
                            formatSearch(flasks[i].name.toLowerCase()).includes(search) ||
                            flasks[i].name.toLowerCase().includes(search)
                        ) {
                            type = "flask";
                            result = flasks[i];
                            break; // Break on match
                        }
                    }
                }
                
                // Maps 
                if (!result) {
                    for (var i = 0; i < maps.length; i++) {
                        if (
                            formatSearch(maps[i].name.toLowerCase()).includes(search) ||
                            maps[i].name.toLowerCase().includes(search)
                        ) {
                            type = "map";
                            result = maps[i];
                            break; // Break on match
                        }
                    }
                }
                
                // Jewels 
                if (!result) {
                    for (var i = 0; i < jewels.length; i++) {
                        if (
                            formatSearch(jewels[i].name.toLowerCase()).includes(search) ||
                            jewels[i].name.toLowerCase().includes(search)
                        ) {
                            type = "map";
                            result = jewels[i];
                            break; // Break on match
                        }
                    }
                }
                
                var response = "";
                var br = "\n";
                if (result) {
                    // Format response based on item type
                    response =
                            result.name + br + 
                            result.baseItem;
                    response = addDef(result.defenses, response);
                    response = addReq(result.requirements, response);
                    response = addImplicit(result.mods.implicit, response);
                    response = addExplicit(result.mods.explicit, response);
                    
                    // Send item info as response
                    commands.sendMessage(message, response, null, 4); 
                    
                } else {
                    commands.sendMessage(message, "Couldn't find an item with that name.");
                }

            } else {
                commands.sendMessage(message, this.help);
            }
        }
    },
        {
        cmd: "!setDefaultLeague",
        alias: "!setdefaultleague",
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
        alias: "!poeLadder",
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
        text += "\Block: " + def.block;
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
