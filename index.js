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

// setup nconf to pull in environment variables and commandline flags
nconf.argv()
    .env()
    .file({ file: 'config.json' });

var screenCaptureCommand = nconf.get('screenCaptureCommand'),
	defaultStatus = 'running...',
    idx = nconf.get('idx'),
	noVid = nconf.get('noVideo'),
	refreshRate = nconf.get('refreshRate'),
	statusHeight = nconf.get('statusHeight'),
	newWidth = nconf.get('newWidth'),
	newHeight = nconf.get('newHeight'),
	width = '850',
	webcam;


// Create a screen object for
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
// create status box to display messages
var statusBox = blessed.box({
	bottom: '0',
	left: 'center',
	width: width,
	height: statusHeight,
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
// add boxes to screen
screen.append(box);
screen.append(statusBox);
// Render the screen.
screen.render();
// Focus our element.
box.focus();

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], _exitHandler);
process.on('exit', _exitHandler);
process.on('SIGINT', _exitHandler);

// take snapshots when left mouse is clicked
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

if (nconf.get('testDimensions')) {
	// special test flag to just show the boxes with the vertical axis numbered
	runDimensionTest();
} else {
	// normal mode, start capturing
	runDemo();
}

// --- Helper functions ---

// main demo loop, start the camera and call render on each frame
function runDemo () {
	// TODO(CAW) Should be able to modify camera cam = new cv.VideoCapture idx, add line after to call cam.set(CV_CAP_PROP_FRAME_WIDTH, 640); cam.set(CV_CAP_PROP_FRAME_HEIGHT, 480);
	// init cam
	webcam = camera.createStream(idx);
	webcam.on('error', function (err) {
		box.setContent('error reading data' + err)
	});
	// frame ready
	webcam.on('data', function (buffer) {
		// render the output
		render(buffer);
	});

	// start the recording
	setTimeout(function() {
		webcam.snapshot(function (err, buffer){});
		webcam.record(refreshRate, function (buffers){});
	}, 100);
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
		// draw the image to a canvas and size it correctly
		var pic = new Canvas.Image;
		pic.src = buffer;
		var ctx = (new Canvas(newWidth, newHeight)).getContext('2d');
		ctx.drawImage(pic, 0, 0, newWidth, newHeight);
		// convert to frame to text and display result
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