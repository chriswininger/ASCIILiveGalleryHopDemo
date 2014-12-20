spawn = require('child_process').spawn;
exec = require('child_process').exec;

var interval = 60000;

var mainProc;

_startMainProc();
setInterval(_killMainProcess, interval);


function _killMainProcess () {
    mainProc.kill();
}

function _startMainProc () {
    mainProc = exec('/usr/X11/bin/xterm -fg SkyBlue -bg black -fullscreen  -e "export TERM=xterm-256color && node ./index.js"', function (error, stdout, stderr){
        if (error) console.error('error starting main process: ' + error);
    });
    if (mainProc) {
        mainProc.on('close', function (code) {
            mainProc.removeAllListeners('close');
            console.log('main process exited with code ' + code + '\n restarting the process');
            _startMainProc();
        });
    }
}