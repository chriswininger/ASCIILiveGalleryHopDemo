var express = require('express'),
    nconf = require('nconf'),
    multer = require('multer');

nconf.argv()
    .env()
    .file({ file: __dirname + '/../config.json' });

var port = 3000;

var app = new express();
app.set('views', __dirname + '/public/views');
app.set('view engine', 'jade');

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
    console.log('/twitter/uploads: ' + req.files);
    res.status(200).json({ status: 'ok' });
});

app.listen(port);
console.log('listening on port ' + port);