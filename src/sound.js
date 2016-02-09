// PolarBot
// sound.js

exports.joinChannel = function(server, bot, channel) {
    server = server.channels.get("name", channel);
    bot.joinVoiceChannel(server, channel);
}

exports.leaveChannel = function(bot) {
    bot.leaveVoiceChannel();
}

exports.play = function(bot) {
    console.log("playing");
}
