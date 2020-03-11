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
MongoClient.connect(uri, {useUnifiedTopology: true}, function(err, client) {
    assert.equal(null, err);
    console.log('Successfully connected to Mongo server');
    db = client.db(dbName);
});

app.use(express.static('static'));

app.use(function (req, res, next){
    console.log("HTTP request", req.method, req.url, req.body);
    next();
});


/* ***** Data types *****
    building objects:
        - (String) _id (the name of the building)   (PK)
        - (String) description
        - (String) imageId                          (FK)
        - (Date) createdAt
        - (Date) updatedAt

    user objects:
        - (String) _id (the user entered username)  (PK)
        - (String) saltedHash
        - (String) firstName
        - (String) lastName
        - (String) email        (UNIQUE)
        - (String) bio
        - (String) imageId
        - (Date) createdAt
        - (Date) updatedAt
*/


// SIGN UP/IN/OUT -------------------------------------------------------------


// CREATE ---------------------------------------------------------------------

// create a building
app.post('/api/buildings/', function(req, res, next) {
    if (!('_id' in req.body)) return res.status(400).end('_id is missing');

    let newBuilding = {
        _id: req.body._id,
        description: req.body.description,
        imageId: req.body.imageId,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    let buildings = db.collection('buildings');
    
    buildings.findOne({_id: req.body._id}, function(err, building) {
        if (err) return res.status(500).end(err);
        if (building) return res.status(409).end('building _id: ' + req.body._id + ' already exists');

        // insert building
        buildings.insertOne(newBuilding, function(err, result) {
            if (err) return res.status(500).end(err);
            return res.json(newBuilding);
        });
    })
});


// READ -----------------------------------------------------------------------

// get all buildings
app.get('/api/buildings/', function(req, res, next) {
    db.collection('buildings').find({}).toArray(function(err, buildings) {
        if (err) return res.status(500).end(err);
        return res.json(buildings);
    })
});

// UPDATE ---------------------------------------------------------------------


// DELETE ---------------------------------------------------------------------

// delete a building
app.delete('/api/buildings/:buildingId/', function(req, res, next) {
    let buildings = db.collection('buildings');
    buildings.findOne({_id: req.params.buildingId}, function(err, building) {
        if (err) return res.status(500).end(err);
        if (!building) return res.status(404).end('Cannot delete building. Building _id: ' + req.params.buildingId + ' does not exist');
        
        buildings.removeOne({_id: building._id}, {multi: false}, function(err) {
            if (err) return res.status(500).end(err);
            res.json(building);
        });
    });
});

const http = require('http');
const PORT = process.env.PORT || 3000;

// http.createServer(app).listen(PORT, function (err) {
//     if (err) console.log(err);
//     else console.log("HTTP server on http://localhost:%s", PORT);
// });

app.listen(PORT, function(err) {
    if (err) console.log(err);
    else console.log("HTTP server on http://localhost:%s", PORT);
})