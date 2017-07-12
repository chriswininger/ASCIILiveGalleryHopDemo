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
const snapWaitDurration = 2000;
let camera;
let lastSnapShot;

// setup nconf to pull in environment variables and commandline flags
nconf.argv()
    .env()
    .file({ file: 'config.json' });

let screenCaptureCommand = nconf.get('screenCaptureCommand');
let defaultStatus = 'running...';
let idx = nconf.get('idx');
let noVid = nconf.get('noVideo');
let refreshRate = nconf.get('refreshRate');
let statusHeight = nconf.get('statusHeight');
let newWidth = nconf.get('newWidth');
let newHeight = nconf.get('newHeight');
const runColorTest = nconf.get('runColorTest');

let width = '850';
let running = false;
let foundGoodFrame = false;
let txt;

// Create a screen object for
var screen = blessed.screen(),
	program = blessed.program();
program.enableMouse();
// create box to display hello world
var box = blessed.box({
	top: 0,
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

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], _exitHandler);
screen.key(['d'], function() {
	newWidth++;
	statusBox.setContent(newWidth + 'x' + newHeight);
});
screen.key('a', function() {
	newWidth--;
	statusBox.setContent(newWidth + 'x' + newHeight);
});
screen.key(['w'], function() {
	newHeight++;
	statusBox.setContent(newWidth + 'x' + newHeight);
});
screen.key(['s'], function() {
	newHeight--;
	statusBox.setContent(newWidth + 'x' + newHeight);
});

screen.key('');

process.on('exit', _exitHandler);
process.on('SIGINT', _exitHandler);

// take snapshots when left mouse is clicked
screen.on('mouse', function(data) {
	if (data.action === 'mouseup') return;

	if (data.action === 'mousedown' && data.button === 'left') {
		if (lastSnapShot && (Date.now() - lastSnapShot < snapWaitDurration)) {
			statusBox.setContent('Too fast too furious! Picture in process...');
			return;
		}

		lastSnapShot = Date.now();
		takeSnapShot(function (err) {
			if (err) {
				statusBox.setContent('error: ' + err);
				screen.render();
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
	if (!runColorTest) {
		const camWidth = 320;
		const camHeigt = 240;
		camera = new cv.VideoCapture(idx);

		camera.setWidth(camWidth);
		camera.setHeight(camHeigt);
		console.log('setup camera');
		setTimeout(function () {
			setInterval(function () {
				camera.read(function (err, img) {
					if (err)
						return statusBox.setContent('error reading camera: ' + err);

					render(img);
				});
			}, camInterval);
		}, 100);
	} else {
		try {
			statusBox.setContent('running color test');
			screen.render();
			// special test mode which renders a single still image
			const imgFile = fs.readFileSync('./colorTest.png')
			cv.readImage(imgFile.slice(0), function (err, img) {
				if (err) {
					statusBox.setContent('error: ' + err);
					screen.render();
					return;
				}

				statusBox.setContent('rendering test input');
				screen.render();
				render(img);
				statusBox.setContent('rendered test image');
				screen.render();
			})
		} catch (ex) {
			statusBox.setContent('error rendering test: ' + ex);
			screen.render();
		}
	}
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

function render(img) {
	try {
		if (running) {
			return;
		}
		running = true;

		if (img.width() <= 0) {
			running = false;
			return;
		}

		// the first time we get a good frame erase messages left by opencv
		if (!foundGoodFrame) {
			foundGoodFrame = true;
			// clear screen and append our ui elements
			program.clear();
			// add boxes to screen
			screen.append(box);
			screen.append(statusBox);
			// Render the screen.
			screen.render();
			// Focus our element.
			box.focus();
		}
		img.resize(newWidth, newHeight);
		// draw the image to a canvas and size it correctly
		// convert to frame to text and display result
		txt = ascii.init('cli', img, newWidth, newHeight, noVid);
		box.setContent(txt);
		screen.render();
		running = false;
	} catch (ex) {
		statusBox.setContent('error: ' + ex);
		screen.render();
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
