var colors = require(__dirname + '/colors.js');
var support = require(__dirname + '/../support.js');
var Texts = require(__dirname + '/texts.js');
var nconf = require('nconf');

nconf.argv()
    .env()
    .file({ file: __dirname + '/../../config.json' });

var colorCache = {};
var maxLines = nconf.get('maxLines');
var wordWrapWidth = nconf.get('wordWrapWidth');

var texts = new Texts(1000, wordWrapWidth, maxLines, 0, function (entry) {
	entry.startY += 1;
	if (entry.startY > maxLines) entry.startY = 0;
});

var textsOverFlow = new Texts(1000, wordWrapWidth, maxLines, -maxLines, function (entry) {
    entry.startY = texts.texts.allTexts.startY - maxLines;
});

// global values to reduce overhead of var declaration in loop
var i, c, h, w, loopX, loopY, currentDist = null, rgbTest = null;
var index;
var r;
var g;
var b;
var gray;
var color;
var p;
var dataHeight;
var dataWidth;
var key;
var colorsKeys = Object.keys(colors.rgb);
var closestDist = null;
var colorKey = null;
var hexKey;
var pixelRow;
var text;

var Ascii = {
  style: "<style type='text/css'>* {margin: 0;padding: 0;} .ascii {font-size: 12px;font-family: simsun;}</style>",
  // 按照不同的终端输出
  types: {
    cli: {
      br: '\n',
      blank: ' '
    },
    html: {
      br: '</br>',
      blank: '&nbsp;'
    }
  },
  // 根据灰度生成相应字符
  toText: function(type, g, color, x, y, noVid) {
    if (noVid) return color + (texts.getAnyText(x,y)  ||  textsOverFlow.getAnyText(x,y) ||  ' ') + colors.console.default;
  	if (g <= 30) {
		c = '#';
    } else if (g > 30 && g <= 60) {
		c = '&';
    } else if (g > 60 && g <= 120) {
		// get text if there
		c = texts.getAnyText(x,y) || '$';
    } else if (g > 120 && g <= 150) {
		c = '*';
    } else if (g > 150 && g <= 180) {
		c = 'o';
    } else if (g > 180 && g <= 210) {
      	c = '!';
    } else if (g > 210 && g <= 240) {
      	c = ';';
    } else {
		return this.types[type].blank;
    }

	return color + c + colors.console.default;
  },
  getColor: function (r, g, b) {
      closestDist = null;
      colorKey = null;

      hexKey = r.toString(16) + g.toString(16) + g.toString(16);
      if (colorCache[hexKey]) return colorCache[hexKey];
      i = colorsKeys.length - 1;
      do {
        key = colorsKeys[i];
        rgbTest = colors.rgb[key];
        currentDist = this.getDistance(rgbTest, [r,g,b]);
        if (currentDist === 0) {
          colorKey = key;
          break;
        } else if (closestDist === null || currentDist < closestDist) {
          closestDist = currentDist;
          colorKey = key;
        }
      } while(i--);

      colorCache[hexKey] = colors.console[colorKey];
      return colors.console[colorKey];
  },
  getDistance: function (p1, p2) {
    return Math.sqrt(
        Math.pow(p2[0] - p1[0], 2) +
        Math.pow(p2[1] - p1[1], 2) +
        Math.pow(p2[2] - p1[2], 2)
    );
  },
  getPoemChar: function (x, y) {
      var width = 10;
     // var i = 
  },
  // 根据rgb值计算灰度
  getGray: function(r, g, b) {
    return 0.299 * r + 0.578 * g + 0.114 * b;
  },
  // 初始化
  init: function(type, pic, width, height, noVid) {
    loopY = 0;
    text = '';
    var pixelRow;

    for (h = 0; h < height; h += 12) {
      p = '';
	  loopX = 0;
	  pixelRow = pic.pixelRow(h);

      for (w = (width * 3 - 12); w >= 0; w -= 12) {
          r = pixelRow[w];
          g = pixelRow[w + 1];
          b = pixelRow[w + 2];
          gray = this.getGray(r, g, b);
          color = this.getColor(r, g, b);
          p += this.toText(type, gray, color, loopX++, loopY, noVid);
      }

	  loopY++;
      p += this.types[type].br;
      text += p;
    }

    return (type === 'html') ? self.style + "<div class='ascii'>" + text + '</div>' : text;
  }
}

module.exports = Ascii;
