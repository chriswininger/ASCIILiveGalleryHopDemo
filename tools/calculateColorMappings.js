var fs = require('fs'),
    util = require('util'),
    colors = require(__dirname + '/colors.js')
    util = require('util');

var total = 256*256*256;
var cnt = 0,
    hash,
    c,
    r,
    g,
    b;

    process.stdout.write('{');
    for (r = 0; r < 256; r++) {
        for (g = 0; g < 256; g++) {
            for (b = 0; b < 256; b++) {
                hash = pad(r.toString(16)) + pad(g.toString(16)) + pad(b.toString(16));
                c = getColor(r, g, b);
                var msg = util.format('"%s":"%s",', hash, c.replace('\033', '\\033'));
                process.stdout.write(msg);
                cnt++;
            }
        }
    }

    process.stdout.write('}');


function getColor(r, g, b) {
    var self = this,
        closestDist = null,
        colorKey = null,
        currentDist = null,
        rgbTest = null;

    for (var key in colors.rgb) {
        rgbTest = colors.rgb[key];
        currentDist = getDistance(rgbTest, [r,g,b]);
        if (currentDist === 0) {
            colorKey = key;
            break;
        } else if (closestDist === null || currentDist < closestDist) {
            closestDist = currentDist;
            colorKey = key;
        }
    }

    return colors.console[colorKey];
}

function getDistance (p1, p2) {
    return Math.sqrt(
        Math.pow(p2[0] - p1[0], 2) +
        Math.pow(p2[1] - p1[1], 2) +
        Math.pow(p2[2] - p1[2], 2)
    );
}

function pad (str) {
    var pad = "00";
    return pad.substring(0, pad.length - str.length) + str;
}