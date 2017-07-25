var mongojs = require('mongojs'),
    nconf = require('nconf'),
    fs = require('fs'),
    _ = require('lodash'),
    restler = require('restler'),
    NodeTwitter = require('node-twitter');
const async = require('async');

nconf.argv()
    .env()
    .file({ file: __dirname + '/../config.json' });

// connect to mongo db to persist files we've sent to the server
console.log('connection go mongo db: ' + nconf.get('mongo_connection'));

var snapShotPath = __dirname + '/../snapshots';
var db = mongojs(nconf.get('mongo_connection'));
var uploadedFiles = db.collection('uploaded_files');
var existingFiles = [];
var watchInterval = 60000;

const sendToTwitter = nconf.get('sendToTwitter');

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
	let running = false;
    _check();
    // perform the check on a regular interval
    setInterval(_check, watchInterval);

    function _check () {
        if (!running) {
            running = true;
        } else {
            console.log('still waiting on previous run');
            return;
        }

        async.waterfall([
            function _getFileName(_next) {
				fs.readdir(snapShotPath, function (err, files) {
					if (err)
					    return _next(err);
				    var newFiles = _.difference(files, existingFiles);
					_next(null, newFiles);
				});
            },
            function _tryToTweet(newFiles, _next) {
                async.eachSeries(newFiles, function(img, _nextImg) {
					// skip hidden files
					if (img.indexOf('.') === 0) {
					    existingFiles.push(img);
					    return _nextImg();
					}

					// post image to twitter
					postImageToServer(img, function (err) {
						if (err) {
						    console.error('could not post ' + img);
						    return _nextImg();
						}

						// flag file as having been added to database
						insertFile(img, function (err) {
							// flag file as having been inserted in memory
							existingFiles.push(img);
							if (err) {
							    console.error('error saving record to db: ' + err);
							}

							console.info('file sent to server: ' + img);
							_nextImg();
						});
					})
                }, _next);
            }
        ], function(err) {
            running = false;
            if (err)
                console.warn(err);
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

        if (!sendToTwitter) {
            console.log('skipping image send - twitter post disabled');
            setTimeout(function() {
                complete();
            }, 1000);
            return;
        }

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