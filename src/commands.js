// PolarBot
// commands.js

var mysql = require('mysql');
var config = require('./config/config.js');
var app = require('./app.js');
var logger = require('./logger.js');
var db = require('./database.js');

// Extending modules
var tenman = require('./tenman.js');

var commands = [
    { 
        cmd: '!remove',
        help: 'Removes a command. Usage: !remove <!command>.',
        execute: function(message) {
            var command = getCmd(message.content, 1);
            if (isAdmin(message) && command != undefined && command.length > 1 && command[0] === '!') {
                getConnection(function(err, connection) {
                    if (!err) {
                        connection.query('DELETE FROM commands WHERE command = "?";', [command], function(err) {
                            connection.release();
                            if (err) {
                                logger.log('ERROR REMOVING !COMMAND FROM DATABASE: ' + err);
                                sendMessage(message, 'Error removing "' + command + '" from database. See logs for details.');
                            }
                            else sendMessage(message, 'Removed "' + command + '" from database.');                        
                        });
                    }
                });
            }
        }
    },
    {
        cmd: '!add',
        help: 'Adds a new text-based command with a response. Usage: !add <!command> <response>.',
        execute: function(message) {
            var command = getCmd(message.content, 1);
            var response = splitCmd(message.content, 2);
            
            // Check if command is valid
            if (command != undefined && command[0] === '!' && command.length > 1 && command.length && command.length < 21) {
                // Check if response is valid
                if (response.length > 0 && response.length < 1001) {
                    db.query('INSERT INTO commands(command, response, user) VALUES("?", "?", "?");', function(err) {
                        if (err) {
                            logger.log('ERROR ADDING !COMMAND TO DATABASE: ' + err);
                            sendMessage(message, 'An error happened. The !command might be taken.');
                        } else {
                            logger.log('Command "' + command + '" with response "' + response + '" was added to database successfully.')
                            sendMessage(message, 'Command "' + command + '" was added successfully.');
                        }
                    }, [command, response, message.sender.username]);
                } else sendMessage(message, this.help);
            } else sendMessage(message, this.help);
        }
    },
    { 
        cmd: '!hello',
        execute: function(message) {
            sendMessage(message, 'Hello, ' + message.sender.username + '.');
        }
    },
    {
        cmd: '!topic',
        execute: function(message) {
            if (isAdmin(message))
            {
                app.bot.setChannelTopic(message, splitCmd(message.content, 1));
                markForDeletion(message);
            }
        }
    },
    {
        cmd: '!ip',
        execute: function(message) {
            if (getCmd(message.content, 1) === 'connect')
                sendMessage(message, 'steam://connect/' + getCmd(message.content, 2), 5);
            else
                sendMessage(message, 'steam://connect/' + getCmd(message.content, 1), 5);
        }
    },
    {
        cmd: 'connect',
        execute: function(message) {
            sendMessage(message, 'steam://connect/' + getCmd(message.content, 1), 5);
        }
    },
    {
        // Creates an invite which is valid for 5 minutes and can only be used once
        cmd: '!invite',
        alias: '!createinvite',
        help: 'Creates a one-time-use invite which is valid for 5 minutes.',
        execute: function(message) {
            var opt = {};
            opt.maxAge = 300;
            opt.maxUses = 1;
            opt.temporary = false;
            opt.xkcd = true;
            app.bot.createInvite(message.channel, opt, function(error, invite) {
                sendMessage(message, 'This invite can only be used once and is valid for 5 minutes. https://discord.gg/' + invite.code, 5);
            });
        }
    },
    {
        cmd: '!clear',
        alias: '!delete',
        help: 'Clears a desired amount of your own messages. Usage: !clear <amount>.',
        execute: function(message) {
            var opt = getCmd(message.content, 1);
            if (opt == parseInt(opt)) {
                opt = parseInt(opt);
                opt++;
                app.bot.getChannelLogs(message.channel, 100, function(error, messages) {
                    if (error) return;
                    else {
                        var amount = 0;
                        for (var i = 0; i < messages.length; i++) {
                            if (messages[i].sender == message.sender) {
                                app.bot.deleteMessage(messages[i]);
                                amount++;
                            }
                            if (amount === opt) return;
                        }
                    }
                });
            } else sendMessage(message, this.help);
        }
    },
    {
        cmd: '!clearbot',
        alias: '!botclear',
        help: 'Deletes a desired amount of bot messages. Usage: !clearbot <amount>.',
        execute: function(message) {
            var opt = getCmd(message.content, 1);
            if (opt == parseInt(opt)) {
                opt = parseInt(opt);
                app.bot.getChannelLogs(message.channel, 100, function(error, messages) {
                    if (error) return;
                    else {
                        app.bot.deleteMessage(message);
                        var amount = 0;
                        for (var i = 0; i < messages.length; i++) {
                            if (messages[i].sender.username == app.bot.user.username) {
                                app.bot.deleteMessage(messages[i]);
                                amount++;
                            }
                            if (amount === opt) {
                                return;
                            }
                        }
                    }
                });
            } else sendMessage(message, this.help);
        }
    },
    {
        cmd: '!remindme',
        alias: '!timer',
        help: 'Usage: !timer <minutes> <(optional)message>.',
        execute: function(message) {
            var opt = getCmd(message.content, 1);
            if (opt == parseInt(opt)) {
                    opt = parseInt(opt);
                    var txt = splitCmd(message.content, 2);
                    sendMessage(message, 'I will remind you in ' + opt + ' minute(s).', opt);
                    opt = opt * 1000 * 60; // milliseconds to minutes
                    setTimeout(function() {
                       sendMessage(message, message.sender.mention() + ' ' + txt);
                    }, opt);
            } else sendMessage(message, this.help);
        }
    },
    {
        cmd: '!help',
        alias: '!commands',
        help: 'Usage: !help <(optional)!command>.',
        execute: function(message) {
            var opt = getCmd(message.content, 1);
            if (opt != undefined && opt[0] === '!') {
                // !help !<cmd>
                for (var i = 0; i < commands.length; i++) {
                    if (commands[i].help != undefined) {
                        if (commands[i].cmd === opt || commands[i].alias === opt) {
                            sendMessage(message, commands[i].help);
                            return;
                        }
                    }
                }
            } else if (message.content === this.cmd || message.content === this.alias) {
                // !help
                var txt = 'Available commands: ';
                for (var i = 0; i < commands.length; i++) {
                    txt += commands[i].cmd;
                    txt += ', ';
                }
                getDbCommands(message, function(rows) {
                    for (var i = 0; i < rows.length; i++) {
                        txt += rows[i].command;
                        if (i != rows.length - 1) {
                            txt += ', ';
                        } else txt += '. To get more information on a certain command, use !help <!command>.';
                    }
                    var pmChannels = app.bot.privateChannels;
                    var pmChannel = pmChannels.get("recipient", message.sender);
                    sendMessage(pmChannel, txt);
                });
            } else sendMessage(message, this.help);
        }
    },
    {
        cmd: '!coinflip',
        alias: '!cointoss',
        help: 'Usage: !coinflip. Flips a coin. Heads or tails.',
        execute: function(message) {
            var random = Math.round(Math.random())
            var res = '';
            if (random == 0) {
                res = 'Heads.';
            } else if (random == 1) {
                res = 'Tails.';
            }
            sendMessage(message, res);
        }
    }
];

// Load extending modules
load(tenman);

function load(cmds) {
    for (var i = 0; i < cmds.length; i++) {
        commands.push(cmds[i]);
    }
}

exports.command = function(message) {
    var currentCommand = getCmd(message.content);
    // Go through the array of command-objects
    for (var i = 0; i < commands.length; i++) {
        if (currentCommand === commands[i].cmd || currentCommand === commands[i].alias) {
            logger.log('Executing ' + commands[i].cmd + '...');
            commands[i].execute(message);
            return;
        }
    }
    if (message.content[0] === '!') {
        getDbCommands(message, function(rows) {
            if (rows != undefined) {
                for (var i = 0; i < rows.length; i++) {
                    var cmd = rows[i].command.replace(/'/g, '');
                    if (getCmd(message.content) === cmd) {
                        logger.log('Executing ' + cmd + '...');
                        sendMessage(message, rows[i].response.replace(/'/g, ''));
                        return; 
                    }
                }
            }
        });
    }
}

function sendMessage(cmdMessage, content, deletionTime) { // deletionTime in minutes, 0 = no deletion
    app.bot.sendMessage(cmdMessage, content, function(error, message) {
        markForDeletion(cmdMessage, deletionTime);
        markForDeletion(message, deletionTime);
    });
}

function markForDeletion(message, delay) {
    // Deletes a message after delay(ms) has passed
    if (delay !== undefined && delay != 0 && delay == parseInt(delay)) {
            delay = delay * 60 * 1000; // minutes to ms
        } else {
            // delay = 1 min * defaultdeletiontime
            delay = 60 * 1000 * config.defaultDeletionTime;
    }
    setTimeout(function() {
        app.bot.deleteMessage(message);
    }, delay);
}

function getCmd(cmd, index) {
    // Used for getting commands at split[index]
    var i = index == undefined ? 0 : index;
    return cmd.split(' ')[i];
}

function splitCmd(cmd, index) {
    // Index is used for telling how many splits to skip
    var i = index === undefined ? 1 : index;
    var split = cmd.split(' ');	
    var joined = '';
    for (var i = index; i < split.length; i++) {
        joined += split[i] + ' ';
    }
    return joined;
}

function getDbCommands(message, callback) {
    db.query('SELECT * FROM commands', function(err, rows) {
        if (err) {
            sendMessage(message, 'Database connection failed. See logs for more information.');
        }
        return callback(rows)
    });
}

function isAdmin(message) {
    // Checks if user is admin of the server the message was sent in
    var roles = [];
    roles = message.channel.server.rolesOf(message.sender);
    for (var i = 0; i < roles.length; i++) {
        if (roles[i].name == 'admin') return true;
    }
    return false;
}

// Export functions
exports.isAdmin = isAdmin;
exports.getCmd = getCmd;
exports.splitCmd = splitCmd;
exports.sendMessage = sendMessage;