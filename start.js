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
var exec = require('child_process').exec;

var MINUTE= 60000;
var interval = MINUTE*5;

var mainProc;

_startMainProc();
setInterval(_killMainProcess, interval);


function _killMainProcess () {
	console.log('stopping main process: ' + mainProc.pid);
    _killTree(mainProc.pid);
}

function _startMainProc () {
    mainProc = exec('xterm -fg SkyBlue -bg black -fullscreen  -e "export TERM=xterm-256color && node ./index.js"', function (error, stdout, stderr){
        if (error) console.error('error starting main process: ' + error);
    });
    if (mainProc) {
        mainProc.on('close', function (code) {
            mainProc.removeAllListeners('close');
            console.log('main process (' + mainProc.pid + ') exited with code ' + code + '\n restarting the process');
            _startMainProc();
        });
    }
}

// Kills the whole process tree (adapted from http://krasimirtsonev.com/blog/article/Nodejs-managing-child-processes-starting-stopping-exec-spawn)
function _killTree (pid, signal, callback) {
	signal   = signal || 'SIGKILL';
	callback = callback || function () {};
	var killTree = true;
	if(killTree) {
		psTree(pid, function (err, children) {
			[pid].concat(
				children.map(function (p) {
					return p.PID;
				})
			).forEach(function (tpid) {
					try { process.kill(tpid, signal) }
					catch (ex) { }
				});
			callback();
		});
	} else {
		try { process.kill(pid, signal) }
		catch (ex) { }
		callback();
	}
}