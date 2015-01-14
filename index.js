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

var camera = require('camera'),
    Canvas = require('canvas'),
    ascii = require(__dirname + '/lib/ascii/ascii.js'),
    fs = require('fs'),
    exec = require('child_process').exec,
    blessed = require('blessed'),
    nconf = require('nconf'),
    crypto = require('crypto');


nconf.argv()
    .env()
    .file({ file: 'config.json' });

var screenCaptureCommand = "import -window `xprop -root 32x '\t$0' _NET_ACTIVE_WINDOW | cut -f 2`",
	defaultStatus = 'running...',
    idx = nconf.get('idx'),
	noVid = nconf.get('noVideo'),
	webcam;

// Render an image buffer to ascii
var newWidth = 1000;
var newHeight = 1000;
var width = '850';

// Create a screen object
var screen = blessed.screen(),
	program = blessed.program();
program.enableMouse();
// create box to display hello world
var box = blessed.box({
	top: 'center',
	left: 'center',
	width: width,
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

var statusBox = blessed.box({
	bottom: '0',
	left: 'center',
	width: width,
	height: '75',
	content: defaultStatus,
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
screen.append(statusBox);
// Render the screen.
screen.render();
// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], _exitHandler);

process.on('exit', _exitHandler);
process.on('SIGINT', _exitHandler);

screen.on('mouse', function(data) {
	if (data.action === 'mouseup') return;

	if (data.action === 'mousedown' && data.button === 'left') {
		takeSnapShot(function (err) {
			if (err) {
				statusBox.setContent('error: ' + err);
			} else {
				statusBox.setContent('You look great kid!');
				setTimeout(function () {
					statusBox.setContent(defaultStatus);
				}, 4000);
			}
		});
	}
});
// Focus our element.
box.focus();

if (nconf.get('testDimensions')) {
	runDimensionTest();
} else {
	runDemo();
}

// --- Helper functions ---
function runDemo () {
	// TODO(CAW) Should be able to modify camera cam = new cv.VideoCapture idx, add line after to call cam.set(CV_CAP_PROP_FRAME_WIDTH, 640); cam.set(CV_CAP_PROP_FRAME_HEIGHT, 480);
	// init cam
	webcam = camera.createStream(idx);
	webcam.on('error', function (err) {
		box.setContent('error reading data' + err)
	});
	webcam.on('data', function (buffer) {
		render(buffer);
	});

	webcam.snapshot(function (err, buffer){});
	webcam.record(1000, function (buffers){});
}

function runDimensionTest () {
	box.setContent('running dimension test');
	screen.render();

	var str = '';
	for (var y = 0; y < 100; y++) {
		str += y + '\n';
	}
	box.setContent(str);
	screen.render();

}

function render(buffer) {
	try {
		//console.log('rendering: ' + require('util').inspect(buffer));
		var pic = new Canvas.Image;
		pic.src = buffer;
		var ctx = (new Canvas(newWidth, newHeight)).getContext('2d');

		ctx.drawImage(pic, 0, 0, newWidth, newHeight);

		box.setContent(ascii.init('cli', ctx, pic, newWidth, newHeight, noVid));
		screen.render();
	} catch (ex) {
		box.setContent('error: ' + ex);
	}
}

function takeSnapShot (complete) {
	exec(screenCaptureCommand + ' ./snapshots/' + crypto.randomBytes(10).toString('hex') + '.png', {}, complete);
}

function _exitHandler() {
	console.log('cleaning up');
	try {
		webcam.destroy();
		program.disableMouse();
	} catch (ex) {
		console.error('error in cleanup: ' + ex);
	}

	return process.exit(0);
}