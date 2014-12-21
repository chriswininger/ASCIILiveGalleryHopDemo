/**
 * Author: Chris Wininger
 * Project: ASCII Live Gallery Hop Demo 2015
 * File: index.js
 *
 * This is the main thread which initializing the webcam and begins processing
 *   the input
 *
 * @type {childrenOfPid|exports}
 */

var fs = require('fs');
var camera = require('camera');
var Canvas = require('canvas');
var ascii = require(__dirname + '/lib/ascii/ascii.js');
var fs = require('fs');
var spawn = require('child_process').spawn;
var blessed = require('blessed');

// Create a screen object
var screen = blessed.screen();
// create box to display hello world
var box = blessed.box({
	top: 'center',
	left: 'center',
	width: '900',
	height: '900',
	content: 'Rendering...',
	tags: true,
	border: {
		type: 'line'
	},
	style: {
		fg: 'white',
		border: {
			fg: '#f0f0f0'
		}
	}
});
// add box to screen
screen.append(box);
// Render the screen.
screen.render();
// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
	webcam.destroy();
	return process.exit(0);
});
// Focus our element.
box.focus();

var idx = 0;
// init cam
var webcam = camera.createStream(idx);
webcam.on('error', function (err) {
	box.setContent('error reading data' + err)
});
webcam.on('data', function (buffer) {
	render(buffer);
});

webcam.snapshot(function (err, buffer){});
webcam.record(1000, function (buffers){});

// --- Helper functions ---
// Render an image buffer to ascii
function render(buffer) {
	try {
		//console.log('rendering: ' + require('util').inspect(buffer));
		var pic = new Canvas.Image;
		var newWidth = 1000;
		var newHeight = 1000;
		pic.src = buffer;
		var cv = new Canvas(newWidth, newHeight);
		var ctx = cv.getContext('2d');

		ctx.drawImage(pic, 0, 0, newWidth, newHeight);

		box.setContent(ascii.init('cli', ctx, pic, newWidth, newHeight));
		screen.render();
	} catch (ex) {
		box.setContent('error: ' + ex);
	}
}
