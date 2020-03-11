const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const express = require('express');
const app = express();
const { body, check, validationResult } = require('express-validator');

// to retrieve important variables from a .env file (keeping DB credentials and others out of source code)
require('dotenv').config();

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const cookie = require('cookie');
const session = require('express-session');

app.use(session({
    secret: `${process.env.SESSION_SECRET}`,
    resave: false,
    saveUninitialized: true,
    cookie: {
        // secure: true, // only allow cookie over HTTPS connection
        sameSite: 'strict' // restrict cookie from being sent out of this site
    } 
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


// HELPERS --------------------------------------------------------------------

function buildErrorMessage(errors) {
    errorMessage = '';
    errors.array().forEach(error => {
        switch (error.param) {
            case 'username':
            case 'firstName':
            case 'lastName':
                errorMsg = errorMsg.concat(error.param + ' must be alphanumeric; ');
                break;
            case 'email':
                errorMsg = errorMsg.concat(error.param + ' must be an email address; ');
                break;
            case 'bio':
                errorMsg = errorMsg.concat(error.param + ' must be less than 1000 characters; ');
                break;
            case 'password':
                errorMsg = errorMsg.concat('password must be at least 8 characters; ');
                break;
        }
    });
    return errorMesssage.slice(0, -2)
};

let isAuthenticated = function(req, res, next) {
    if (!req.session.username) return res.status(401).end("access denied");
    next();
};



// SIGN UP/IN/OUT -------------------------------------------------------------
app.post('/signup/', [
    check('username').isAlphanumeric(),
    check('password').isLength({ min: 8 }),
    check('firstName').optional().isAlphanumeric(),
    check('lastName').optional().isAlphanumeric(),
    check('email').optional().isEmail(),
    check('bio').optional().isLength({ max: 1000 })
], function(req, res, next) {
    
    // validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        errorMsg = buildErrorMessage(errors);
        return res.status(422).end(errorMsg);
    }

    let newUser = {
        _id: req.body.username,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        bio: req.body.bio,
        imageId: req.body.imageId,
        createdAt: new Date(),
        updatedAt: new Date()
    }

    let users = db.collection('users');

    users.findOne({_id: newUser._id}, function(err, user) {
        if (err) return res.status(500).end(err);
        if (user) return res.status(409).end("username " + newUser._id + " already exists");

        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(newUser.password, salt, function(err, saltedHash) {
                newUser.password = saltedHash
                users.insertOne(newUser, function(err, result) {
                    if (err) return res.status(500).end(err);
                    return res.json('user ' + newUser._id + ' signed up');
                })
            })
        })
    });

});

app.post('/signin/', [
    check('username').isAlphanumeric(),
], function (req, res, next) {

    // validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        errorMsg = buildErrorMessage(errors);
        return res.status(422).end(errorMsg);
    }

    let username = req.body.username;
    let password = req.body.password;

    // retrieve user from the db
    let users = db.collection('users');
    users.findOne({_id: username}, function(err, user) {
        if (err) return res.status(500).end(err);
        if (!user) return res.status(401).end('access denied. Have you created an account?');
        bcrypt.compare(password, user.password, function(err, valid) {
            if (err) return res.status(500).end(err);
            if (!valid) return res.status(401).end('access denied');

            // start session
            req.session.user = user;
            res.setHeader('Set-Cookie', cookie.serialize('username', user._id, {
                // secure: true, /* only attach cookies on HTTPS connection*/
                sameSite: 'strict', /* restrict cookie from being sent out of this site */
                path : '/', 
                maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
            }));
            return res.json("user " + username + " signed in");
        });
    })
});

app.get('/signout/', function(req, res, next) {
    req.session.destroy();
    res.setHeader('Set-Cookie', cookie.serialize('username', '', {
        // secure: true, /* only attach cookies on HTTPS connection*/
        sameSite: 'strict', /* restrict cookie from being sent out of this site */
        path : '/', 
        maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
  }));
  res.redirect('/');
});

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

// const http = require('http');
const PORT = process.env.PORT || 3000;

// http.createServer(app).listen(PORT, function (err) {
//     if (err) console.log(err);
//     else console.log("HTTP server on http://localhost:%s", PORT);
// });

app.listen(PORT, function(err) {
    if (err) console.log(err);
    else console.log("HTTP server on http://localhost:%s", PORT);
})