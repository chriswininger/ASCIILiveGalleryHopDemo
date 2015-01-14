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
var exec = require('child_process').exec;
var proc = exec('xterm -fg SkyBlue -bg black -fullscreen  -fa "Monospace" -fs 8 -e "export TERM=xterm-256color && node ./processWatcher.js"', function (error) {
    if (error) console.error('error starting main process: ' + error);
});

process.on('exit', _exitHandler);
process.on('SIGINT', _exitHandler);

function _exitHandler () {
    console.log('exiting demo');
    proc.kill();
}


