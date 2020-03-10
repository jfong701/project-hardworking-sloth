const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const session = require('express-session');

// to retrieve important variables from a .env file (keeping DB credentials and others out of source code)
require('dotenv').config();

app.use(session({
    secret: `${process.env.SESSION_SECRET}`,
    resave: false,
    saveUninitialized: true
}));

// mongoDB testing connection on MongoDB Atlas
const dbName = `${process.env.DB_NAME}`;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@studyroomfinderdev-ds998.mongodb.net/test?retryWrites=true&w=majority`;
let db;
MongoClient.connect(uri, function(err, client) {
    assert.equal(null, err);
    console.log('Successfully connected to server');
    db = client.db(dbName);
});

app.use(express.static('static'));

app.use(function (req, res, next){
    console.log("HTTP request", req.method, req.url, req.body);
    next();
});

// SIGN UP/IN/OUT -------------------------------------------------------------


// CREATE ---------------------------------------------------------------------


// READ -----------------------------------------------------------------------

// get all buildings
app.get('/api/buildings/', function(req, res, next) {
    db.collection('buildings').find({}).forEach(function(building) {
        console.log(building);
    });
});

// UPDATE ---------------------------------------------------------------------


// DELETE ---------------------------------------------------------------------



const http = require('http');
const PORT = 3000;

http.createServer(app).listen(PORT, function (err) {
    if (err) console.log(err);
    else console.log("HTTP server on http://localhost:%s", PORT);
});