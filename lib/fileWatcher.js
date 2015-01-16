var mongojs = require('mongojs'),
    nconf = require('nconf'),
    fs = require('fs'),
    _ = require('lodash'),
    restler = require('restler'),
    NodeTwitter = require('node-twitter');

nconf.argv()
    .env()
    .file({ file: __dirname + '/../config.json' })
    .file({ file: __dirname + '/../twitterSecrets.json'});


console.log('!!! ' + nconf.get('mongo_connection'));
var snapShotPath = '../snapshots';

var db = mongojs(nconf.get('mongo_connection'));
var uploadedFiles = db.collection('uploaded_files');
var existingFiles = ['.DS_Store', '.gitignore'];

var twitterClient = new NodeTwitter.RestClient(
    nconf.get('consumer_key'),
    nconf.get('consumer_secret'),
    nconf.get('access_token_key'),
    nconf.get('access_token_secret')
);


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
    console.log('posting image: ' + img);
    var path = __dirname + '/../snapshots/' + img;
    fs.exists(path, function (exists) {
        twitterClient.statusesUpdateWithMedia({
                'status': nconf.get('twitterStatus'),
                'media[]': path
            }, function(error, result) {
                if (error) console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
                if (result) console.log('image posted');
            }
        );
    });
    complete();
}

function insertFile (file, complete) {
    uploadedFiles.insert({ fileName: file, saved_at: new Date() }, complete);
}