// PolarBot
// logger.js

var commands = require('./commands.js');

exports.logMessage = function(message) {
    console.log(
        currentTime() +
        'on ' + message.channel.server +
        '/' + message.channel.name + ' - ' +
        message.sender.username +
        ': ' + message.cleanContent
    );
}

// Logs a message
exports.log = function(message) {
    var content = currentTime() + message;
    console.log(content);
}

// Get current time in a nice, log-friendly format
function currentTime() {
    var curTime = new Date();
    curTime = curTime.getDate() + '.' + 
        (curTime.getMonth() + 1) + '.' + 
        curTime.getFullYear() + ' ' + 
        curTime.getHours() + ':' + 
        curTime.getMinutes() + ' ';
    return curTime;
}

// Not in use, use local time
function toHHMM(date) {
    var txt = '';
    var hours = '';
    var minutes = '';
    hours = date.getHours().toString();
    minutes = date.getMinutes().toString();
    if (hours.length == 1) hours = '0' + hours;
    if (minutes.length == 1) minutes = '0' + minutes;
    txt += hours;
    txt += ':';
    txt += minutes;
    return txt;
}
