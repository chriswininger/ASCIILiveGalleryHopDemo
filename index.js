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

const cv = require('opencv');
const camFps = 32;
const camInterval = 1000 /camFps;
const ascii = require(__dirname + '/lib/ascii/ascii.js');
const fs = require('fs');
const exec = require('child_process').exec;
const blessed = require('blessed');
const nconf = require('nconf');
const crypto = require('crypto');

let camera;

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
	const camWidth = 320;
	const camHeigt = 240;
	camera = new cv.VideoCapture(idx);

	camera.setWidth(camWidth);
	camera.setHeight(camHeigt);
	console.log('setup camera');
	setTimeout(function() {
		setInterval(function () {
			camera.read(function (err, img) {
				if (err)
					return console.error('error reading camera: ' + err);

				render(img);
			});
		}, camInterval);
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

let running = false;
function render(img) {
	try {
		if (running) {
			return;
		}
		running = true;
		img.resize(newWidth, newHeight);
		// draw the image to a canvas and size it correctly
		// convert to frame to text and display result
		box.setContent(ascii.init('cli', img, img.width(), img.height(), noVid));
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
		program.disableMouse();
	} catch (ex) {
		console.error('error in cleanup: ' + ex);
	}

	return process.exit(0);
}