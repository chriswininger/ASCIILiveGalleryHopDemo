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

// connect to mongo db to persist files we've sent to the server
console.log('connection go mongo db: ' + nconf.get('mongo_connection'));

var snapShotPath = '../snapshots';
var db = mongojs(nconf.get('mongo_connection'));
var uploadedFiles = db.collection('uploaded_files');
var existingFiles = [];
var wathInterval = 1000;

// instantiate client to talk to twitter
var twitterClient = new NodeTwitter.RestClient(
    nconf.get('consumer_key'),
    nconf.get('consumer_secret'),
    nconf.get('access_token_key'),
    nconf.get('access_token_secret')
);

// populate lists of files we've already uploaded from the database
uploadedFiles.find(function (err, files) {
    if (err) return console.error('error reading files from db: ' + err);
    existingFiles = _.pluck(files, 'fileName');

    // begin watch loop
    watch();
});


// ---- Helper Methods ---

// watch loop -- check the the directory for new files and upload them
function watch () {
    _check();
    // perform the check on a regular interval
    setInterval(_check, wathInterval);
    function _check () {
        fs.readdir(snapShotPath, function (err, files) {
            var newFiles = _.difference(files, existingFiles);
            if (newFiles.length > 0) {
                _.each(newFiles, function (img) {
                    // skip hidden files
                    if (img.indexOf('.') === 0) return  existingFiles.push(img);;
                    // post image to twitter
                    postImageToServer(img, function (err) {
                       if (err) return console.error('could not post ' + img);
                       // flag file as having been added to database
                        insertFile(img, function () {
                            // flag file as having been inserted in memory
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
// handle posting to twitter
function postImageToServer (img, complete) {
    console.log('posting image: ' + img);
    var path = __dirname + '/../snapshots/' + img;
    // check if file exists (twitter api throws unhandled exception instead of proper error callback for missing files)
    fs.exists(path, function (exists) {
        if (!exists) return complete('file does not exist: ' + path);
        // twee that pic
        twitterClient.statusesUpdateWithMedia({
                'status': nconf.get('twitterStatus'),
                'media[]': path
            }, function(error, result) {
                if (error) console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
                if (result) console.log('image posted');
                complete(error);
            }
        );
    });
}
// insert files we've processed into the db so we don't do them again
function insertFile (file, complete) {
    uploadedFiles.insert({ fileName: file, saved_at: new Date() }, complete);
}