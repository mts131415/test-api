var app = require('express')();
const fileUpload = require('express-fileupload');
var cors = require('cors')
var bodyParser = require('body-parser');
const fs = require('fs');
const authorize = require('./configs/authorize');

require('dotenv').config();

//  Custom config
var port = process.env.PORT || 7777;
// app.use(bodyParser.urlencoded({
//     extended: true
// }));
app.use(cors());
app.use(fileUpload());
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
//app.use(express.multipart());

//  Routes

var router = require('./routes/index');
app.use('/', router);

var router = require('./routes/admin/index');
app.use('/admin/', router);

app.get('/', function (req, res) {
    res.send('<h1>Hello Node.js</h1>');
});

app.get('/uploads/:folder/:file', function (req, res) {
    const folder = req.params.folder;
    const file = req.params.file;
    let img = null;
    let status = 200;
    try {
        img = fs.readFileSync(__dirname + "/uploads/" + folder + "/" + file);
    } catch (error) {
        status = 404;
    }
    res.writeHead(status, { 'Content-Type': 'image/*' });
    res.end(img, 'binary');
});

app.listen(port, function () {
    console.log('Starting node.js on port ' + port);
});

