// Polarbot
// weather.js
// Weater-module

// Dependencies
var app = require("../app.js");
var config = require("../config/config.js");
var commands = require("../commands.js");
var logger = require('../logger.js'); 
var scrape = require('./scrape.js');
var request = require("request");

var cmds = [
    {
        cmd: "!weather",
        alias: "!sää",
        execute: function(message) {
            // Get options (options are optional)
            var opt = commands.getCmd(message.content, 1);

            // default-option
            if (opt == "default") {
                setDefaultLocation(userID, location);
                return;
            }

            // if there are no options, use user default
            else if (opt == '') {
                getDefaultLocation(); // TODO callback?
            }

            // else use option[i] as city
            else {
                getWeather(message, opt);
            }
        }
    }
];

// Returns a string representing current weather in given city
function getWeather(message, city) {
    request(config.wSite + city, function readWeather(error, response, body) {
        body = scrape(body);

        // Location
        var location = body.findByClass("location-name");
        if (location.length == 0) {
            // Log error, send informational error message
            logger.log("ERROR: Couldn't get weather for location: " + city)
            commands.sendMessage(message, "Couldn't get weather information for " + city);
            return;
        }
        location = location[0].content;

        // Temperature
        var temperature = body.findByClass("meteogram-temperatures");
        temperature = scrape(temperature[0].content);
        
        curTemperature = temperature.findByClass("temperature");
        curTemperature = curTemperature[0].content;

        // Feels like
        var feelsLike = body.findByClass("apparent-temperature-value");
        feelsLike = feelsLike[0].content;

        // Probability of rain
        var rainProb = body.findByClass("probability-of-precipitation-value");
        rainProb = rainProb[0].content;

        // Rain last hour
        var rainAmount = body.findByClass("precipitation-amount");
        rainAmount = rainAmount[0].content;
  
        // Wind
        var wind = body.findByClass("wind");
        wind = wind[0].attributes[1].value;

        // Make first letter uppercase
        var uChar = wind.charAt(0);
        uChar = uChar.toUpperCase();
        wind = uChar + wind.substring(1, wind.length);

        // Weather symbol
        var wSymbol = body.findByClass("weather-symbol");
        wSymbol = wSymbol[0].attributes[0].value.split(" ");
        wSymbol = wSymbol[1];
        
        // LANGUAGE
        // FI
        var content = "";
        content = 
            "Lämpötila: " + curTemperature +
            ", tuntuu kuin: " + feelsLike +
            "\nSateen mahdollisuus: " + rainProb + 
            "\n" + wind;

        // Respond with information
        app.bot.uploadFile({
            to: message.channelID,
            file: "./weather/img/" + wSymbol + ".png",
            message: location
        }, function(error, response) {
            if (!error) {
                commands.markForDeletion(response.id, response.channel_id);
                commands.markForDeletion(message.id, message.channelID);
            } else {
                console.log(error);
                logger.log("Error in sending weather information: " + error);
            }
            commands.sendMessage(message, content);
        });
    });
}


// sets default location for user
function setDefaultLocation(userID, location) {

}

// gets default location of user'
function getDefaultLocation(userID) {
    return location;
}

// Export commands
module.exports = cmds;
