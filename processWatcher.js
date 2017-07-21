/**
 * Author: Chris Wininger
 * Project: ASCII Live Gallery Hop Demo 2015
 * File: start.js
 *
 * This launches the main thread of the project, monitors it and restarts it any time it gets closed
 * There is an interval defined which automatically restarts the process to keep it from bogging down the
 *   system as there appears to be some performance issues with extended use at this point in time
 *
 * @type {childrenOfPid|exports}
 */
var psTree = require('ps-tree');
const { spawn, exec, fork } = require('child_process');

var MINUTE= 60000;
var interval = MINUTE*5;

var mainProc;
var fileWatcherProc;

_startMainProc();
//_startFileWatcherProc();
setInterval(_refreshMainProcess, interval);


process.on('exit', _exitHandler);
process.on('SIGINT', _exitHandler);

function _killMainProcess () {
	console.log('stopping main process: ' + mainProc.pid);
	mainProc.removeAllListeners();
	mainProc.kill();
}

let restarting = false;
function _refreshMainProcess () {
	restarting = true;
	_killMainProcess();
	_startMainProc();
}

function _startMainProc () {
	mainProc = spawn('node', ['index.js'], {
		stdio: 'inherit'
	});
	mainProc.on('exit', function(args){
		if (restarting) {
			console.log('restarting the process');
			restarting = false;
		} else {
			console.log('manual exit called');
			process.exit(0);
		}
	});
}

function _startFileWatcherProc () {
	fileWatcherProc = fork('node', ['./lib/fileWatcher.js'], {
		stdio: 'ignore'
	});
	fileWatcher.on('exit', function(){
		console.log('file watcher died');
	});
}

function _stopFileWatcherProc() {

}

function _exitHandler () {
	console.log('exiting demo');
	try {
		mainProc.removeAllListeners();
		mainProc.kill();
	} catch (ex) {
		console.error('error exiting demo: ' + ex);
	}

	process.exit(0);
}
