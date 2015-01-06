var mongojs = require('mongojs'),
    nconf = require('nconf'),
    fs = require('fs'),
    _ = require('lodash');

nconf.argv()
    .env()
    .file({ file: __dirname + '/../config.json' });

var snapShotPath = '../snapshots';


var db = mongojs(nconf.get('mongo_connection'));
var uploadedFiles = db.collection('uploaded_files');
var existingFiles = [];

uploadedFiles.find(function (err, files) {
    if (err) return console.error('error reading files from db: ' + err);
    existingFiles = _.pluck(files, 'fileName');
    watch();
});

function watch () {
    setInterval(_check, 1000);

    function _check () {
        fs.readdir(snapShotPath, function (err, files) {
            var newFiles = _.difference(files, existingFiles);
            if (newFiles.length > 0) {
                _.each(newFiles, function (img) {
                   postImageToServer(img, function (err) {
                       if (err) return console.error('could not post ' + img);
                       insertFile(img, function () {
                           existingFiles.push(img);
                           if (err) return console.error('error saving file: ' + err);
                           console.info('file sent to server: ' + img);
                       });
                   })
                });
            }
        });
    }
}

function postImageToServer (img, complete) {
    complete();
}

function insertFile (file, complete) {
    uploadedFiles.insert({ fileName: file, saved_at: new Date() }, complete);
}