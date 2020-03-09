const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
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

// to retrieve database variables from a .env file (keeping DB credentials out of source code)
require('dotenv').config();


// mongoDB testing connection on MongoDB Atlas
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@studyroomfinderdev-ds998.mongodb.net/test?retryWrites=true&w=majority`;
// console.log('this is uri', uri);
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  client.close();
});

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