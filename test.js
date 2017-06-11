var camera = require('camera');
var idx = 1;
var refreshRate = 500;


process.on('exit', _exitHandler);
process.on('SIGINT', _exitHandler);


// init cam
var webcam = camera.createStream(idx);
webcam.on('error', function (err) {
	console.log('!!! err: ' + err);
});
webcam.on('data', function (buffer) {
	console.log('got data');
});

setTimeout(function() {
	webcam.snapshot(function (err, buffer){});
	webcam.record(refreshRate, function (buffers){});
}, 100);

function _exitHandler() {
	console.log('cleaning up');
	try {
		webcam.destroy();
	} catch (ex) {
		console.error('error in cleanup: ' + ex);
	}

	return process.exit(0);
}