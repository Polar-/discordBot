// PolarBot
// commands.js

var sound = require('./sound.js');
var mysql = require('mysql');
var config = require('./config/config.js')
var app = require('./app.js');

// Init MySql-connection
var pool = mysql.createPool({
    host     : config.dbHost,
    user     : config.dbUser,
    password : config.dbPassword,
    database : config.dbDatabase
});

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
                            if (err) {
                                console.log('ERROR REMOVING !COMMAND FROM DATABASE: ' + err);
                                sendMessage(message, 'Error removing "' + command + '" from database.');
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
            
            // Check if given command is valid
            if (command != undefined && command[0] === '!' && command.length > 1 && command.length && command.length < 21) {
                // Check if given response is valid
                if (response.length > 0 && response.length < 1001) {
                    getConnection(function(err, connection) {
                       if (!err) {
                           connection.query('INSERT INTO commands(command, response) VALUES("?", "?");', [command, response], function(err) {
                                if (err) {
                                    console.log('ERROR ADDING !COMMAND TO DATABASE: ' + err);
                                    sendMessage(message, 'An error happened. The !command might be taken.');
                                } else {
                                    console.log('Command "' + command + '" with response "' + response + '" was added to database successfully.')
                                    sendMessage(message, 'Command "' + command + '" was added successfully.');
                                }
                           });
                       } 
                    });
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
                    sendMessage(message, 'I will remind you in ' + opt + ' minute(s).');
                    opt = opt * 1000 * 60; // milliseconds to minutes
                    setTimeout(function() {
                       sendMessage(message, message.sender.mention() + ' ' + txt);
                    }, opt);
            } else sendMessage(message, this.help);
        }
    },
    {
        cmd: '!help',
        alias: '!halp',
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
                    sendMessage(message, txt);
                });
            } else sendMessage(message, this.help);
        }
    }
];

/* NOT IN USE WITH POOLING
// Node-MySql error handler -- called if no error-callback is queried and an error happens
connection.on('error', function(err) {
  console.log('MYSQL ERROR:' + err.code);
});
*/

exports.command = function(message) {
    var currentCommand = getCmd(message.content);
    // Go through the array of command-objects
    for (var i = 0; i < commands.length; i++) {
        if (currentCommand === commands[i].cmd || currentCommand === commands[i].alias) {
            console.log('Executing ' + commands[i].cmd + '...');
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
                        console.log('Executing ' + cmd + '...');
                        sendMessage(message, rows[i].response.replace(/'/g, ''));
                        return; 
                    }
                }
            }
        });
    }
}

function sendMessage(cmdMessage, content, deletionTime) { // deletionTime = minutes, 0 = no deletion
    app.bot.sendMessage(cmdMessage, content, function(error, message) {
        if (deletionTime !== undefined && deletionTime != 0 && deletionTime == parseInt(deletionTime)) {
            deletionTime = deletionTime * 60 * 1000; // minutes to ms
        } else {
            // Default deletion delay = 1 min
            deletionTime = 1 * 60 * 1000;
        }
        markForDeletion(cmdMessage, deletionTime);
        markForDeletion(message, deletionTime);
    });
}

function markForDeletion(message, delay) {
    // Deletes a message after delay(ms) has passed
    setTimeout(function() {
        app.bot.deleteMessage(message);
    }, delay);
}

function getConnection(callback) {
    pool.getConnection(function(err, connection) {
        if (err) {
            console.log('MYSQL Error getting connection from pool: ' + err);
            return callback(err, connection);
        }
        else return callback(err, connection);
    });
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
    getConnection(function(err, connection) {
        if (!err) {
            connection.query('SELECT * FROM commands', function(err, rows) {
                if (err) {
                    sendMessage(message, 'Database connection failed.');
                    return callback(undefined);
                } else return callback(rows);
            });
        }
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
