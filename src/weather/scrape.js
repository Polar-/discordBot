// Scraper.js

// Base object
function scrape(html) {
    var cont = new content(html);
    return cont;
}

function content(body) {
    this.content = body;
    this.elements = this.elements();    
}

content.prototype.elements = function() {
    var tags = [];
    // Save current position in variable
    var curPos = 0;
    // Get all tags
    while (curPos < this.content.length) {
        var start = this.content.indexOf("<", curPos);
        if (start == -1) { break };
        var end = this.content.indexOf(">", start + 1) + 1;
        curPos = end;
        
        // Init new tag
        var tag  = {}
        tag.name = this.content.substring(start + 1, end - 1);
        tag.start = start;
        tag.end = end;
        
        // Remove scripts (they mess up tag detection badly)
        if (tag.name.substring(0, 6) == "script") {
            this.content = this.content.substring(0, tag.start) + " " + this.content.substring(this.content.indexOf("</script>", tag.end) + 9, this.content.length);
            curPos = start;
        }
        // If tag is not comment or linebreak
        else if (tag.name.substring(0, 2) != "br" && tag.name.substring(0, 1) != "!") {
            // Exclude attributes
            if (tag.name.indexOf(" ") != -1) {
                tag.name = tag.name.substring(0, tag.name.indexOf(" "));
            }
            tags.push(tag);
        }
        
    }
    
    var tmpTags = tags.slice();
    
    // Get endpoints for tags
    var i = 0;
    while (i < tags.length) {
        var tag = tags[i];
        var skipTags = 0;
        
        // Find ending tag for current tag
        for (var j = i + 1; j < tags.length; j++) {
            endTag = undefined;
            // Skip ending tags if there are same tags in the element
            if (tags[j].name == tag.name) {
                skipTags++;
            } else if (tags[j].name == "/" + tag.name && skipTags == 0) {
                // Set tag endtag
                tag.endTag = tags[j];
                break;
            } else if (tags[j].name == "/" + tag.name && skipTags > 0) {
                skipTags--;
            }
        }
        i++;
    }
    
    // Get attributes of all tags
    for (var i = 0; i < tags.length; i++) {
        tags[i].attributes = [];
        // if tag is not an ending tag </tag>
        if (tags[i].name.substring(0, 1) != "/") {
            // Ignore tag if it has no attributes
            if (this.content.substring(tags[i].start, tags[i].end).split(" ").length > 1) {
                // Exclude tag name from attributes
                var attributes = this.content.substring(tags[i].start + tags[i].name.length + 2, tags[i].end - 1)
                // Some tags are ended with />, remove the slash symbol
                if (attributes.substring(attributes.length - 1, attributes.length) == "/") {
                    attributes = attributes.substring(0, attributes.length - 1);
                }

                while (attributes.length > 0) {
                    var attribute = {};
                    attribute.name = attributes.substring(0, attributes.indexOf("="));
                    attributes = attributes.substring(attributes.indexOf("=") + 1, attributes.length);
                    
                    // Find corresponding quote ( " OR ' ) by getting the character after = -symbol
                    var quoteChar = attributes.substring(0, 1);
                    attribute.value = attributes.substring(1, attributes.indexOf(quoteChar, 1));
                    attributes = attributes.substring(attributes.indexOf(quoteChar, 1) + 2, attributes.length);
                    tags[i].attributes.push(attribute);
                }
            }
        }
    }
    return tags;
}

scrape.attribute = function(attr, element) {
    for (var i = 0; i < element.attributes.length; i++) {
        if (element.attributes[i].name == attr) {
            return element.attributes[i];
        }
    }
    return false;
}

function getContent(element, content) {
    if (element.endTag) {
        return content.substring(element.end, element.endTag.start);
    } else {
        return false;
    }
}

// SEARCHING

// Returns elements (and contents) with given identifier(s)
// CLASS CONTAINS VALUE
// EXAMPLE: 
// VALUE "bold" MATCHES CLASS "bold-center" OR "center-bold"
content.prototype.findByClassContains = function(value) {
    var matched = [];
    // Go through all elements
    for (var i = 0; i < this.elements.length; i++) {
        // Find class in attributes
        // Break on fail
        for (j = 0; j < this.elements[i].attributes.length; j++) {
            if (this.elements[i].attributes[j].name.toLowerCase() == "class") {
                if (this.elements[i].attributes[j].value.toLowerCase().includes(value.toLowerCase())) {
                    this.elements[i].content = getContent(this.elements[i], this.content);
                    matched.push(this.elements[i]);
                }
                break;
            }
        }
    }
    return matched;
}

// Returns elements (and contents) with given identifier(s)
// LOOKS FOR SINGLE CLASS - MATCHED ELEMENTS MUST HAVE ALL CLASSES BUT CAN HAVE ADDITIONAL UNSPECIFIED CLASSES
// EXAMPLE: 
// VALUE "bold" DOES NOT MATCH CLASS "bold-center"
// VALUE "bold center" MATCHES CLASSES "center bold thickborder" AND "bold thickborder center"
content.prototype.findByClass = function(value) {
    var matched = [];

    // Create an array of value string (split with " " - empty space)
    if (value.includes(" ")) {
        value = value.split(" ");
    } else {
        value = [value];
    }

    // Go through all elements
    for (var i = 0; i < this.elements.length; i++) {
        // Find class in attributes
        // Break on fail
        for (j = 0; j < this.elements[i].attributes.length; j++) {
            if (this.elements[i].attributes[j].name.toLowerCase() == "class") {
                // Check if values match with classes
                // Split classes with " " - empty space
                var classes = this.elements[i].attributes[j].value.toLowerCase().split(" ");
                
                // Go through classes
                var reqMatches = value.length;
                for (var k = 0; k < value.length; k++) {
                    // Compare to all classes from element, break on match
                    for (var l = 0; l < classes.length; l++) {
                        // Check if classes match
                   	    if (value[k] == classes[l]) {
                            reqMatches--;
                            break;
                        }
                    }
                }
                // If match is found for every class
                if (reqMatches == 0) {
                    // Add element to matches
                    this.elements[i].content = getContent(this.elements[i], this.content);
                    matched.push(this.elements[i]);
                    break;
                }
                break;
            }
        }
    }
    return matched;
}

// Returns elements (and contents) with given id
content.prototype.findById = function(value) {
    var matched = [];
    // Go through all elements
    for (var i = 0; i < this.elements.length; i++) {
        // Find class in attributes
        // Break on fail
        for (j = 0; j < this.elements[i].attributes.length; j++) {
            if (this.elements[i].attributes[j].name.toLowerCase() == "id") {
                if (this.elements[i].attributes[j].value.toLowerCase().includes(value.toLowerCase())) {
                    this.elements[i].content = getContent(this.elements[i], this.content);
                    matched.push(this.elements[i]);
                }
                break;
            }
        }
    }
    return matched;
}

// Returns elements (and contents) with given element name (for example div)
content.prototype.find = function(value) {
    var matched = [];
    // Go through all elements
    for (var i = 0; i < this.elements.length; i++) {
        if (this.elements[i].name.toLowerCase() == value.toLowerCase()) {
            this.elements[i].content = getContent(this.elements[i], this.content);
            matched.push(this.elements[i]);
        }   
    }
    return matched;
}

// Export scraping function
module.exports = scrape;