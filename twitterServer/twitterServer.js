/*
    Probably not needed maybe remove
 */

var express = require('express'),
    nconf = require('nconf'),
    multer = require('multer'),
    NodeTwitter = require('node-twitter');

nconf.argv()
    .env()
    .file({ file: __dirname + '/../config.json' })
    .file({ file: __dirname + '/../twitterSecrets.json'});


var port = 3000;

var app = new express();
app.set('views', __dirname + '/public/views');
app.set('view engine', 'jade');

var twitterClient = new NodeTwitter.RestClient(
    nconf.get('consumer_key'),
    nconf.get('consumer_secret'),
    nconf.get('access_token_key'),
    nconf.get('access_token_secret')
);


var m = multer({
    dest: './uploads',
    onFileUploadStart: function (file) {
        console.log(file.originalname + ' is starting ...')
    },
    onFileUploadComplete: function (file) {
        console.log(file.fieldname + ' uploaded to  ' + file.path)
    }
});

//app.use();

app.use('/', express.static(__dirname + '/uploads'));
app.post('/twitter/uploads', [m], function (req, res) {
    console.log('posting file to twitter');

    client.post('statuses/update', {status: '#apitest more wow, twitter no like duplicate messages '},  function(error, params, response){
        if (error) console.error('error sending tweet: ' + JSON.stringify(error));
        else console.log('tweet sent');
    });

    res.status(200).json({ status: 'ok' });
});

app.listen(port);
console.log('listening on port ' + port);