const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const session = require('express-session');
app.use(session({
    secret: 'the secret of study room finder',
    resave: false,
    saveUninitialized: true
}));

app.use(express.static('static'));

app.use(function (req, res, next){
    console.log("HTTP request", req.method, req.url, req.body);
    next();
});

// SIGN UP/IN/OUT -------------------------------------------------------------


// CREATE ---------------------------------------------------------------------


// READ -----------------------------------------------------------------------


// UPDATE ---------------------------------------------------------------------


// DELETE ---------------------------------------------------------------------



const http = require('http');
const PORT = 3000;

http.createServer(app).listen(PORT, function (err) {
    if (err) console.log(err);
    else console.log("HTTP server on http://localhost:%s", PORT);
});