// PolarBot
// logger.js

const fs = require('fs');

// Logs a message-object
exports.logMessage = function(message) {
    /*var srv = message.channel.server;
    var chn = message.channel.name;
    var usr = message.sender.username;
    var msg = message.cleanContent;
    
    if (srv == undefined && chn == undefined) {
        srv = "private";
        chn = usr;
    }
    
    var content = currentTime() + srv + '/' + chn + ' - ' + usr + ': ' + msg;
    console.log(content);
    logToFile(content);/*/
}

// Logs a message
exports.log = function(content) {
    content = currentTime() + content;
    console.log(content);
    logToFile(content);
}

// Logs a message into log.txt
function logToFile(content) {
    // Add a line to log.txt
    fs.appendFile('log.txt', content + '\n', function(err) {
        if (err) {
            console.log('An error occurred when logging to file: ' + err);
        }
    });
}

// Get current time in a nice, log-friendly format
function currentTime() {
    var curTime = new Date();
    var date = formatTime(curTime.getDate());
    var month = formatTime((curTime.getMonth() + 1).toString());
    var year = formatTime(curTime.getFullYear());
    var hour = formatTime(curTime.getHours());
    var minute = formatTime(curTime.getMinutes());
    curTime =
        date + '.' + 
        month + '.' + 
        year + ' ' + 
        hour + ':' + 
        minute + ' ';
    return curTime;
}

// Adds a 0 if given number's length is 1
function formatTime(num) {
    var format = '';
    num = num.toString();
    if (num.length == 1) {
        format += '0';
    }
    format += num;
    return format;
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
