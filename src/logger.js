// PolarBot
// logger.js

const fs = require('fs');

// Logs a discordJS-message -object
exports.logMessage = function(message) {
    var content = 
        currentTime() +
        message.channel.server +
        '/' + message.channel.name + ' - ' +
        message.sender.username +
        ': ' + message.cleanContent;
    console.log(content);
    logToFile(content);
}

// Logs a message
exports.log = function(content) {
    content = currentTime() + content;
    console.log(content);
    logToFile(content);
}

function logToFile(content) {
    fs.appendFile('log.txt', content + '\n', function(err) {
        if (err) {
            console.log('An error occurred when logging to file: ' + err);
        }
    });
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
