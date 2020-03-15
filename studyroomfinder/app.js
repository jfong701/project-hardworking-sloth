const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const mongo = require('mongodb');
const assert = require('assert');
const express = require('express');
const app = express();
const { body, check, param, validationResult } = require('express-validator');

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
mongo.MongoClient.connect(uri, {useUnifiedTopology: true}, function(err, client) {
    assert.equal(null, err);
    console.log('Successfully connected to Mongo server');
    db = client.db(dbName);
});

app.use(express.static('static'));

app.use(function (req, res, next){
    let username = (req.session.username)? req.session.username : '';
    res.setHeader('Set-Cookie', cookie.serialize('username', username, {
          /* httpOnly flag not set, because the front end needs access to the username
          username also is not secret information */

          // secure: true, /* only attach cookies on HTTPS connection*/
          sameSite: 'strict', /* restrict cookie from being sent out of this site */
          path : '/', 
          maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
    }));
    next();
    console.log("HTTP request", req.method, req.url, req.body);
});


/* ***** Data types *****
    building objects:
        - (String) _id (the name of the building)   (PK)
        - (String) description
        - (String) imageId                          (FK, not required)
        - (Date) createdAt
        - (Date) updatedAt

    user objects:
        - (String) _id (the user entered username)  (PK)
        - (String) password
        - (String) firstName
        - (String) lastName
        - (String) email                            (UNIQUE)
        - (String) bio
        - (String) imageId                          (FK, not required)
        - (Boolean) isAdmin
        - (Date) createdAt
        - (Date) updatedAt

    study space objects:
        - (String) _id (generated)           (PK)
        - (String) name                      (required)
        - (String) description
        - (int) capacity                     (required)
        - (String) buildingName              (FK)
        - (String) studySpaceStatusName      (FK)
        - (GeoJSON polygon) coordinates      (required)
        - (String) hasOutlets
        - (String) wifiQuality
        - (Boolean) groupFriendly
        - (Boolean) quietStudy
        - (String) imageId                   (FK, not required)
        - (Date) createdAt
        - (Date) updatedAt
*/

// use ES6 classes to make new objects

class Building {
    constructor(buildingName, description, imageId, createdAt, updatedAt) {
        this._id = buildingName;
        this.description = description;
        this.imageId = imageId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
class User {
    constructor(username, password, firstName, lastName, email, bio, imageId, createdAt, updatedAt) {
        this._id = username;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.bio = bio;
        this.imageId = imageId;
        this.isAdmin = false;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

class StudySpace {
    constructor(_id, name, description, capacity, buildingName, polygon, studySpaceStatusName, hasOutlets, wifiQuality, groupFriendly, quietStudy, imageId, createdAt, updatedAt) {
        this._id = _id;
        this.name = name;
        this.description = description;
        this.capacity = capacity;
        this.buildingName = buildingName;
        this.polygon = polygon;
        this.studySpaceStatusName = studySpaceStatusName;
        this.hasOutlets = hasOutlets;
        this.wifiQuality = wifiQuality;
        this.groupFriendly = groupFriendly;
        this.quietStudy = quietStudy;
        this.imageId = imageId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

class AvailabilityReport {
    constructor(_id, username, studySpaceId, studySpaceStatusName, createdAt, updatedAt) {
        this._id = _id;
        this.username = username;
        this.studySpaceId = studySpaceId;
        this.studySpaceStatusName = studySpaceStatusName;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}


// HELPERS --------------------------------------------------------------------

// customized for user validation
function buildUsersErrorMessage(errors) {
    errorMsg = '';
    errors.array().forEach(error => {
        switch (error.param) {
            case 'username':
            case 'firstName':
            case 'lastName':
                errorMsg = errorMsg.concat(error.param + ' must be alphanumeric; ');
                break;
            case 'bio':
                errorMsg = errorMsg.concat(error.param + ' must be less than 1000 characters; ');
                break;
            case 'password':
                errorMsg = errorMsg.concat('password must be at least 8 characters and less than 16; ');
                break;
        }
    });
    return errorMsg.slice(0, -2);
}
// generic error messages
function buildErrorMessage(errors) {
    errorMsg = '';
    errors.array().forEach(error => {
        errorMsg = errorMsg.concat(error.param + ': ' + error.msg + '; ');
    });
    return errorMsg.slice(0, -2);
}

function isNullOrUndef(item) {
    if (item === null || item === undefined) { return true; }
    return false;
}

let isAuthenticated = function(req, res, next) {
    if (!req.session.username) return res.status(401).end('access denied');
    next();
};

let isAdmin = function(req, res, next) {
    db.collection('users').findOne({_id: req.session.username, isAdmin: true}, function(err, result) {
        if (err) return res.status(401).end('access denied, user is not admin');
    });
    next();
};


// SIGN UP/IN/OUT -------------------------------------------------------------


app.post('/signup/', [
    body('username').exists().isAlphanumeric().trim().isLength({max: 100}).escape(),
    body('password').exists().isString().isLength({ min: 8, max: 16 }).escape(),
    body('firstName').optional().trim().escape(),
    body('lastName').optional().trim().escape(),
    body('email').optional().isEmail().trim().normalizeEmail(),
    body('bio').optional().isLength({ max: 1000 }).trim().escape(),
], function(req, res, next) {

    // validation - custom validation for user related
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        errorMsg = buildUsersErrorMessage(errors);
        return res.status(400).end(errorMsg);
    }

    let newUser = new User(
        req.body.username,
        req.body.password,
        req.body.firstName,
        req.body.lastName,
        req.body.email,
        req.body.bio,
        req.body.imageId,
        new Date(),
        new Date()
    );

    let users = db.collection('users');

    users.findOne({_id: newUser._id}, function(err, user) {
        if (err) return res.status(500).end(err);
        if (user) return res.status(409).end("username " + newUser._id + " already exists");

        bcrypt.genSalt(10, function(err, salt) {
            if (err) return res.status(500).end(err);
            bcrypt.hash(newUser.password, salt, function(err, saltedHash) {
                if (err) return res.status(500).end(err);
                newUser.password = saltedHash;
                users.insertOne(newUser, function(err, result) {
                    if (err) return res.status(500).end(err);
                    return res.json('user ' + newUser._id + ' signed up');
                });
            });
        });
    });

});


app.post('/signin/', [
    check('username').exists().isAlphanumeric(),
    check('password').exists().isLength({min: 8, max: 16})
], function (req, res, next) {

    // validation - custom validation for user related
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        errorMsg = buildUsersErrorMessage(errors);
        return res.status(400).end(errorMsg);
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
            req.session.username = user._id;
            res.setHeader('Set-Cookie', cookie.serialize('username', user._id, {
                // secure: true, /* only attach cookies on HTTPS connection*/
                sameSite: 'strict', /* restrict cookie from being sent out of this site */
                path : '/', 
                maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
            }));
            return res.json("user " + username + " signed in");
        });
    });
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


// create a study space
app.post('/api/studySpaces/',
isAuthenticated, isAdmin,
[
    body('name').exists().isLength({min: 1, max: 200}).trim(),
    body('description').optional().isLength({min: 1, max: 500}).trim().escape(),
    body('capacity').exists().isInt({min: 0, max: 2000}),
    body('buildingName').exists().bail().isLength({min: 1, max: 200}).trim().escape(),
    body('studySpaceStatusName').optional().isLength({min: 1, max: 100}).trim().escape(),
    body('polygon').exists().not().isEmpty(),
    body('hasOutlets').optional().isLength({min: 1, max: 100}).trim().escape(),
    body('wifiQuality').optional().isLength({min: 1, max: 100}).trim().escape(),
    body('groupFriendly').optional().isBoolean(),
    body('quietStudy').optional().isBoolean(),
    body('imageId').optional().isMongoId()
],
function(req, res, next) {
    // validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        errorMsg = buildErrorMessage(errors);
        return res.status(400).end(errorMsg);
    }

    let newStudySpace = new StudySpace(
        undefined,
        req.body.name,
        req.body.description,
        req.body.capacity,
        req.body.buildingName,
        req.body.polygon,
        isNullOrUndef(req.body.studySpaceStatusName) ? 'Available' : req.body.studySpaceStatusName,
        req.body.hasOutlets,
        req.body.wifiQuality,
        req.body.groupFriendly,
        req.body.quietStudy,
        req.body.imageId,
        new Date(),
        new Date()
    );
    
    // ensure buildingName, studySpaceStatusName, and imageId are valid
    db.collection('buildings').findOne({_id: newStudySpace.buildingName}, function(err, building) {
        if (err) return res.status(500).end(err);
        if (building === null) { return res.status(400).end('provided buildingName does not exist'); }
        
        // TODO: ensure studySpaceStatusName is valid
        db.collection('studySpaceStatuses').findOne({_id: newStudySpace.studySpaceStatusName}, function(err, statusName) {
            if (err) return res.status(500).end(err);
            if (statusName === null) { return res.status(400).end('provided studySpaceStatusName does not exist'); }
            
            // TODO: ensure imageId, if provided, is valid
            if (isNullOrUndef(newStudySpace.imageId)) {
                // insert study space
                db.collection('studySpaces').insertOne(newStudySpace, function(err, result) {
                    if (err) return res.status(500).end(err);
                    return res.json(newStudySpace);
                });
            } else {                
                db.collection('images').findOne({_id: newStudySpace.imageId}, function(err, image) {
                    if (err) return res.status(500).end(err);
                    if (image == null) { return res.status(400).end('provided imageId does not exist'); }
                    // insert study space
                    db.collection('studySpaces').insertOne(newStudySpace, function(err, result) {
                        if(err) return res.status(500).end(err);
                        return res.json(newStudySpace);
                    });
                });
            }
        });
    });
});


// create a building
app.post('/api/buildings/',
isAuthenticated, isAdmin,
[
    body('name').exists().isLength({min: 1, max: 200}).trim().escape(),
    body('description').optional().isLength({min: 1, max: 500}).trim().escape()
],
function(req, res, next) {

    // validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        errorMsg = buildErrorMessage(errors);
        return res.status(400).end(errorMsg);
    }

    let newBuilding = new Building(req.body.name, req.body.description, req.body.imageId, new Date(), new Date());

    let buildings = db.collection('buildings');
    
    buildings.findOne({_id: newBuilding._id}, function(err, building) {
        if (err) return res.status(500).end(err);
        if (building) return res.status(409).end('building _id: ' + newBuilding._id + ' already exists');

        // insert building
        buildings.insertOne(newBuilding, function(err, result) {
            if (err) return res.status(500).end(err);
            return res.json(newBuilding);
        });
    });
});


// create availability report for a study space
app.post('/api/studySpaces/:studySpaceId/availabilityReports/',
isAuthenticated,
[
    param('studySpaceId').isMongoId(),
],
function(req, res, next) {
    // validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        errorMsg = buildErrorMessage(errors);
        return res.status(400).end(errorMsg);
    }
    console.log('req.session.username', req.session.username);

    let newAR = new AvailabilityReport(
        undefined,
        req.session.username,
        new mongo.ObjectID(req.params.studySpaceId),
        req.body.studySpaceStatusName,
        new Date(),
        new Date()
    );
    
    // ensure studySpaceId exists
    let studySpaceIdExists = new Promise((resolve, reject) => {
        db.collection('studySpaces').findOne({_id: newAR.studySpaceId}, function(err, studySpace) {
            if (err) return res.status(500).end(err);
            if (studySpace === null) { reject(new Error('provided studySpaceId does not exist')); }
            else { resolve(); }
        });
    });

    // ensure studySpaceStatusName is valid
    let studySpaceStatusNameExists = new Promise((resolve, reject) => {
        if (isNullOrUndef(newAR.studySpaceStatusName)) {
            resolve();
        } else {
            db.collection('studySpaceStatuses').findOne({_id: newAR.studySpaceStatusName}, function(err, statusName) {
                if (err) return res.status(500).end(err);
                if (statusName === null) { reject(new Error('provided studySpaceStatusName does not exist')); }
                else { resolve(); }
            });
        }
    });

    // add availability report
    // Check that all promises resolve, if one of them fails, then send error code
    Promise.all([studySpaceIdExists, studySpaceStatusNameExists])
    .then(() => {
        // remove all undefined properties from the newStudySpace object, ensures only provided fields in request are set by Mongo
        // from https://stackoverflow.com/a/38340374
        Object.keys(newAR).forEach(key => newAR[key] === undefined && delete newAR[key]);

        // ensure the user has not made a report for this studySpace in the last X minutes
        const minutesDelay = 5;

        let availabilityReports = db.collection('availabilityReports');
        // get the one latest availabiltiy report by this user on this study space
        availabilityReports.find({username: newAR.username, studySpaceId: newAR.studySpaceId}).sort({createdAt: -1}).limit(1).next(function(err, recentReport) {
            if (err) return res.status(500).end(err);

            // only add report if no recent reports found or the most recent report was more than X minutes ago.
            if (recentReport === null || ((new Date() - recentReport.createdAt)/(60*1000) > minutesDelay)) {
                availabilityReports.insertOne(newAR, function(err, result) {
                    if (err) return res.status(500).end(err);
                    return res.json(newAR);
                });
            } else {
                // compute time since last report, and tell them when they can report again
                let minutes = Math.ceil(minutesDelay - (new Date() - recentReport.createdAt)/(60*1000));
                return res.status(409).end('You have already added an availability report. Please wait ' + minutes + ' minutes to add another report to this study space');
            }
        });
    })
    .catch(rejectReason => {
        // any of the promises rejected, then data is invalid, send a 400 response with the reason
        return res.status(400).end(rejectReason.message);
    });

});


// READ -----------------------------------------------------------------------


// get all buildings
app.get('/api/buildings/', function(req, res, next) {
    db.collection('buildings').find({}).toArray(function(err, buildings) {
        if (err) return res.status(500).end(err);
        return res.json(buildings);
    });
});


// get all study spaces
app.get('/api/studySpaces/', function(req, res, next) {
    db.collection('studySpaces').find({}).toArray(function(err, studySpaces) {
        if (err) return res.status(500).end(err);
        return res.json(studySpaces);
    });
});


// get a study space by id
app.get('/api/studySpaces/:studySpaceId/', 
[
    param('studySpaceId').isMongoId()
],
function(req, res, next) {

    // validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        errorMsg = buildErrorMessage(errors);
        return res.status(400).end(errorMsg);
    }

    let studySpaceId = mongo.ObjectID(req.params.studySpaceId);
    db.collection('studySpaces').findOne({_id: studySpaceId}, function(err, studySpace) {
        if (err) return res.status(500).end(err);
        if (studySpace === null) return res.status(404).end('Provided studySpace._id does not exist');

        return res.json(studySpace);
    });
});


// get all study spaces in a building
app.get('/api/buildings/:buildingId/studySpaces/',
[
    param('buildingId').trim().escape(),
],
function(req, res, next) {

    // validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        errorMsg = buildErrorMessage(errors);
        return res.status(400).end(errorMsg);
    }

    let buildingId = req.params.buildingId;

    db.collection('buildings').findOne({_id: buildingId}, function(err, building) {
        if (err) return res.status(500).end(err);
        if (building === null) return res.status(404).end('Provided building._id does not exist');

        db.collection('studySpaces').find({buildingName: buildingId}).toArray(function(err, studySpaces) {
            if (err) return res.status(500).end(err);
            return res.json(studySpaces);
        });

    });
});


// UPDATE ---------------------------------------------------------------------


// update a study space
app.patch('/api/studySpaces/',
isAuthenticated, isAdmin,
[
    body('_id').exists().isMongoId(),
    body('name').optional().isLength({min: 1, max: 200}).trim(),
    body('description').optional().isLength({min: 1, max: 500}).trim().escape(),
    body('capacity').optional().isInt({min: 0, max: 2000}),
    body('buildingName').optional().bail().isLength({min: 1, max: 200}).trim().escape(),
    body('studySpaceStatusName').optional().isLength({min: 1, max: 100}).trim().escape(),
    body('polygon').optional().not().isEmpty(),
    body('hasOutlets').optional().isLength({min: 1, max: 100}).trim().escape(),
    body('wifiQuality').optional().isLength({min: 1, max: 100}).trim().escape(),
    body('groupFriendly').optional().isBoolean(),
    body('quietStudy').optional().isBoolean(),
    body('imageId').optional().isMongoId()
],
function(req, res, next) {

    // validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        errorMsg = buildErrorMessage(errors);
        return res.status(400).end(errorMsg);
    }

    let newStudySpace = new StudySpace(
        new mongo.ObjectID(req.body._id),
        req.body.name,
        req.body.description,
        req.body.capacity,
        req.body.buildingName,
        req.body.polygon,
        req.body.studySpaceStatusName,
        req.body.hasOutlets,
        req.body.wifiQuality,
        req.body.groupFriendly,
        req.body.quietStudy,
        req.body.imageId,
        undefined,
        new Date() // sets updatedAt to current time
    );

    let studySpaces = db.collection('studySpaces');

    // Use Promises to do DB checks for validity of data

    // check if the study space to update exists
    let studySpaceExists = new Promise((resolve, reject) => {
        studySpaces.findOne({_id: newStudySpace._id}, function(err, studySpace) {
            if (err) return res.status(500).end(err);
            if (studySpace === null) { reject(new Error('provided studySpaceId does not exist')); }
            else { resolve(); }
        });
    });

    // check if studySpaceStatus if provided, is valid
    let studySpaceStatusName = new Promise((resolve, reject) => {
        if (isNullOrUndef(newStudySpace.studySpaceStatusName)) {
            resolve();
        } else {
            db.collection('studySpaceStatuses').findOne({_id: newStudySpace.studySpaceStatusName}, function(err, statusName) {
                if (err) return res.status(500).end(err);
                if (statusName === null) { reject(new Error('provided studySpaceStatusName does not exist')); }
                else { resolve(); }
            });
        }
    });

    // check if building name if provided, is valid
    let buildingNameValid = new Promise((resolve, reject) => {
        if (isNullOrUndef(newStudySpace.buildingName)) {
            resolve();
        } else {
            db.collection('buildings').findOne({_id: newStudySpace.buildingName}, function(err, building) {
                if (err) return res.status(500).end(err);
                if (building === null) { reject(new Error('provided buildingName does not exist')); }
                else { resolve(); }
            });
        }
    });

    // check if image id is valid
    let imageIdValid = new Promise((resolve, reject) => {
        if (isNullOrUndef(newStudySpace.imageId)) {
            resolve();
        } else {
            db.collection('images').findOne({_id: newStudySpace.imageId}, function(err, image) {
                if (err) return res.status(500).end(err);
                if (image == null) { reject(new Error('provided imageId does not exist'));}
                else { resolve(); }
            });
        }
    });

    // Check that all promises resolve, if one of them fails, then send error code
    Promise.all([studySpaceExists, studySpaceStatusName, buildingNameValid, imageIdValid])
    .then(() => {
        // remove all undefined properties from the newStudySpace object, ensures only provided fields in request are set by Mongo
        // from https://stackoverflow.com/a/38340374
        Object.keys(newStudySpace).forEach(key => newStudySpace[key] === undefined && delete newStudySpace[key]);

        // update study space record
        studySpaces.updateOne({_id: newStudySpace._id}, { $set: newStudySpace }, function(err, result) {
            if (err) return res.status(500).end(err);
            return res.json(newStudySpace);
        });
    })
    .catch(rejectReason => {
        // any of the promises rejected, then data is invalid, send a 400 response with the reason
        return res.status(400).end(rejectReason.message);
    });

});


// DELETE ---------------------------------------------------------------------


// delete a building
app.delete('/api/buildings/:buildingId/',
isAuthenticated, isAdmin,
[
    param('buildingId').exists().escape()
],
function(req, res, next) {

    // validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        errorMsg = buildErrorMessage(errors);
        return res.status(400).end(errorMsg);
    }

    let buildings = db.collection('buildings');
    buildings.findOne({_id: req.params.buildingId}, function(err, building) {
        if (err) return res.status(500).end(err);
        if (!building) return res.status(404).end('Cannot delete building. Provided buildingId: does not exist');
        
        buildings.deleteOne({_id: building._id}, function(err) {
            if (err) return res.status(500).end(err);
            res.json(building);
        });
    });
});


// delete a study space
app.delete('/api/studySpaces/:studySpaceId/', 
isAuthenticated, isAdmin,
[
    param('studySpaceId').isMongoId()
],
function(req, res, next) {
    // validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        errorMsg = buildErrorMessage(errors);
        return res.status(400).end(errorMsg);
    }

    // declare variables for convenience
    let studySpaces = db.collection('studySpaces');
    let studySpaceId = new mongo.ObjectID(req.params.studySpaceId);

    // find the study space, if it exists:
    studySpaces.findOne({_id: studySpaceId}, function(err, studySpace){
        if (err) return res.status(500).end(err);
        if (!studySpace) return res.status(404).end('Cannot delete studySpace. Provided studySpaceId does not exist');

        // delete the studyspace
        studySpaces.deleteOne({_id: studySpaceId}, function(err) {
            if (err) return res.status(500).end(err);
            res.json(studySpace);
        });
        
        // TODO: delete the usersFavourites of this studySpace

        // TODO: delete studyspace reviews

        // TODO: delete availability reports of this space
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
});