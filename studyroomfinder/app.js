const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const mongo = require('mongodb');
const assert = require('assert');
const express = require('express');
const cors = require('cors');
const app = express();
const { body, check, param, validationResult } = require('express-validator');
const cookie = require('cookie');
const session = require('express-session');
const bodyParser = require('body-parser');

// to retrieve important variables from a .env file (keeping DB credentials and others out of source code)
require('dotenv').config();

app.use(bodyParser.json());

// time delay used for limiting availability reports, and filtering seeing only reports made for this study space
const minutesDelay = 5;

// mongoDB testing connection on MongoDB Atlas
const dbName = `${process.env.DB_NAME}`;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@studyroomfinderdev-ds998.mongodb.net/test?retryWrites=true&w=majority`;
let db;
mongo.MongoClient.connect(uri, {useUnifiedTopology: true}, function(err, client) {
    assert.equal(null, err);
    console.log('Successfully connected to Mongo server');
    db = client.db(dbName);

    geoIndexForStudySpace(db);
});

const geoIndexForStudySpace = function(db, callback) {
    db.collection('studySpaces').createIndex(
        {"polygon": "2dsphere"}, //field to add index
        null, // options
        function (err, result) { // callback
            // console.log(result);
            // callback();
        }
    );
};

// express settings
const PORT = process.env.PORT || 3000;

app.listen(PORT, function(err) {
    if (err) console.log(err);
    else console.log("HTTP server on http://localhost:%s", PORT);
});

app.use(session({
    secret: `${process.env.SESSION_SECRET}`,
    resave: false,
    saveUninitialized: true,
    cookie: {
        // secure: true, // only allow cookie over HTTPS connection
        sameSite: 'strict' // restrict cookie from being sent out of this site
    } 
}));

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

// use cors package to allow cross origin request from Vue frontend
const whiteList = ['http://localhost:3000', 'http://localhost:8080'];
const corsOptions = {
    origin: function(origin, callback) {
        // console.log('this is the origin', origin);
        if (whiteList.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};
app.use(cors(corsOptions));
app.use(express.static('static'));


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
    let errorMsg = '';
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
    let errorMsg = '';
    errors.array().forEach(error => {
        errorMsg = errorMsg.concat(error.param + ': ' + error.msg + '; ');
    });
    return errorMsg.slice(0, -2);
}

function isNullOrUndef(item) {
    if (item === null || item === undefined) { return true; }
    return false;
}

// request checking
let isAuthenticated = function(req, res, next) {
    if (!req.session.username) return res.status(401).end('access denied');
    next();
};

let isAdmin = function(req, res, next) {
    db.collection('users').findOne({_id: req.session.username, isAdmin: true}, function(err, result) {
        if (err) return res.status(500).end(err.message);
        if (result === null) return res.status(401).end('access denied, user is not admin');
        next();
    });
};

// common DB checks
// note: studySpaceId is of type mongo.ObjectID
let studySpaceIdExists = function(studySpaceId) {
    return new Promise((resolve, reject) => {
        db.collection('studySpaces').findOne({_id: studySpaceId}, function(err, studySpace) {
            if (err) return res.status(500).end(err.message);
            if (studySpace === null) { reject(new Error('provided studySpaceId does not exist')); }
            else { resolve(); }
        });
    });
};

let studySpaceIdExistsInBuilding = function(buildingName, studySpaceId) {
    return new Promise((resolve, reject) => {
        buildingNameExists(buildingName).then(() => {
            db.collection('studySpaces').findOne({_id: studySpaceId, buildingName: buildingName}, function(err, studySpace) {
                if (err) return res.status(500).end(err.message);
                if (studySpace === null) { reject(new Error('provided studySpaceId does not exist in this building')); }
                else { resolve(); }
            });
        })
        .catch((rejectReason) => {
            reject(new Error(rejectReason.message));
        });
    });
};

let studySpaceStatusNameExists = function(studySpaceStatusName) {
    return new Promise((resolve, reject) => {
        db.collection('studySpaceStatuses').findOne({_id: studySpaceStatusName}, function(err, statusName) {
            if (err) return res.status(500).end(err.message);
            if (statusName === null) { reject(new Error('provided studySpaceStatusName does not exist')); }
            else { resolve(); }
        });
    });
};

let buildingNameExists = function(buildingName) {
    return new Promise((resolve, reject) => {
        db.collection('buildings').findOne({_id: buildingName}, function(err, building) {
            if (err) return res.status(500).end(err.message);
            if (building === null) { reject(new Error('provided buildingName does not exist')); }
            else { resolve(); }
        });
    });
};

// note: imageId is of type mongo.ObjectID
let imageIdExists = function(imageId) {
    return new Promise((resolve, reject) => {
        db.collection('images').findOne({_id: imageId}, function(err, image) {
            if (err) return res.status(500).end(err.message);
            if (image == null) { reject(new Error('provided imageId does not exist'));}
            else { resolve(); }
        });
    });
};

let getAvailabilityReports = function(buildingName, studySpaceId) {
    return new Promise((resolve, reject) => {
        studySpaceIdExistsInBuilding(buildingName, studySpaceId).then(() => {
            // the time minutesDelay ago
            let XminsAgo = new Date(Date.now() - minutesDelay*60*1000);
    
            db.collection('availabilityReports').find({studySpaceId: studySpaceId, createdAt: { $gte: XminsAgo }}).toArray(function(err, reports) {
                if (err) return res.status(500).end(err.message);
                resolve(reports);
            });
        })
        .catch((rejectReason) => {
            reject(new Error(rejectReason.message));
        }); 
    });
};

// minimal availability reports to be bundled with getting a study space
// object looks like:
// {isVerified: false, studySpaceStatusName: "available", rawReports: {available: 0, nearlyFull: 0, full: 0}}
let getProcessedAvailabilityReports = function(buildingName, studySpaceId) {
    return new Promise((resolve, reject) => {
        getAvailabilityReports(buildingName, studySpaceId).then((reports) => {
            
            let returnObj = {};

            let rawReports = {available: 0, nearlyFull: 0, full: 0};
            reports.forEach((report) => {
                switch(report.studySpaceStatusName) {
                    case 'Available':
                        rawReports.available++;
                        break;
                    case 'Nearly Full':
                        rawReports.nearlyFull++;
                        break;
                    case 'Full':
                        rawReports.full++;
                        break;
                }
            });
            returnObj.rawReports = rawReports;

            returnObj.studySpaceStatusName = 'Unknown';
            returnObj.isVerified = false;
            let numReports = reports.length;
            let largest = 0;
            for (const statusName in rawReports) {
                if (rawReports[statusName] > numReports/2 && rawReports[statusName] >= 3) {
                    returnObj.isVerified = true;
                }
                // setting status
                if (rawReports[statusName] > largest) {
                    returnObj.studySpaceStatusName = statusName;
                    largest = rawReports[statusName];
                }
            }

            // prettify the study space StatusName
            switch(returnObj.studySpaceStatusName) {
                case 'available':
                    returnObj.studySpaceStatusName = 'Available';
                    break;
                case 'nearlyFull':
                    returnObj.studySpaceStatusName = 'Nearly Full';
                    break;
                case 'full':
                    returnObj.studySpaceStatusName = 'Full';
                    break;
            }

            resolve(returnObj);
        }).catch((rejectReason) => {
            reject(new Error(rejectReason.message));
        });
    });
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
        let errorMsg = buildUsersErrorMessage(errors);
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
        if (err) return res.status(500).end(err.message);
        if (user) return res.status(409).end("username " + newUser._id + " already exists");

        bcrypt.genSalt(10, function(err, salt) {
            if (err) return res.status(500).end(err);
            bcrypt.hash(newUser.password, salt, function(err, saltedHash) {
                if (err) return res.status(500).end(err);
                newUser.password = saltedHash;
                users.insertOne(newUser, function(err, result) {
                    if (err) return res.status(500).end(err.message);
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
        const errorMsg = buildUsersErrorMessage(errors);
        return res.status(400).end(errorMsg);
    }

    let username = req.body.username;
    let password = req.body.password;

    // retrieve user from the db
    let users = db.collection('users');
    users.findOne({_id: username}, function(err, user) {
        if (err) return res.status(500).end(err.message);
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
app.post('/api/buildings/:buildingName/studySpaces/',
isAuthenticated, isAdmin,
[
    body('name').exists().isLength({min: 1, max: 200}).trim(),
    body('description').optional().isLength({min: 1, max: 500}).trim().escape(),
    body('capacity').exists().isInt({min: 0, max: 2000}),
    param('buildingName').exists().isLength({min: 1, max: 200}).trim().escape(),
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
        const errorMsg = buildErrorMessage(errors);
        return res.status(400).end(errorMsg);
    }

    let imageId = req.body.imageId === undefined ? undefined : req.body.imageId;

    let newStudySpace = new StudySpace(
        undefined,
        req.body.name,
        req.body.description,
        req.body.capacity,
        req.params.buildingName,
        req.body.polygon,
        'Available',
        req.body.hasOutlets,
        req.body.wifiQuality,
        req.body.groupFriendly,
        req.body.quietStudy,
        imageId,
        new Date(),
        new Date()
    );
    
    // ensure buildingName, studySpaceStatusName, and imageId are valid
    db.collection('buildings').findOne({_id: newStudySpace.buildingName}, function(err, building) {
        if (err) return res.status(500).end(err.message);
        if (building === null) { return res.status(400).end('provided buildingName does not exist'); }
        
        // ensure studySpaceStatusName is valid
        db.collection('studySpaceStatuses').findOne({_id: newStudySpace.studySpaceStatusName}, function(err, statusName) {
            if (err) return res.status(500).end(err.message);
            if (statusName === null) { return res.status(400).end('provided studySpaceStatusName does not exist'); }
            
            // ensure imageId, if provided, is valid
            if (isNullOrUndef(newStudySpace.imageId)) {
                // insert study space
                db.collection('studySpaces').insertOne(newStudySpace, function(err, result) {
                    if (err) return res.status(500).end(err.message);
                    return res.json(newStudySpace);
                });
            } else {                
                db.collection('images').findOne({_id: newStudySpace.imageId}, function(err, image) {
                    if (err) return res.status(500).end(err.message);
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
        const errorMsg = buildErrorMessage(errors);
        return res.status(400).end(errorMsg);
    }

    let newBuilding = new Building(req.body.name, req.body.description, req.body.imageId, new Date(), new Date());

    let buildings = db.collection('buildings');
    
    buildings.findOne({_id: newBuilding._id}, function(err, building) {
        if (err) return res.status(500).end(err.message);
        if (building) return res.status(409).end('building _id: ' + newBuilding._id + ' already exists');

        // insert building
        buildings.insertOne(newBuilding, function(err, result) {
            if (err) return res.status(500).end(err.message);
            return res.json(newBuilding);
        });
    });
});


// create availability report for a study space
app.post('/api/buildings/:buildingName/studySpaces/:studySpaceId/availabilityReports/',
isAuthenticated,
[
    param('buildingName').isLength({min: 1, max: 200}).trim().escape(),
    param('studySpaceId').isMongoId(),
    body('studySpaceStatusName').exists().isLength({min: 1, max: 100}).trim().escape(),   
],
function(req, res, next) {
    // validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMsg = buildErrorMessage(errors);
        return res.status(400).end(errorMsg);
    }

    let newAR = new AvailabilityReport(
        undefined,
        req.session.username,
        new mongo.ObjectID(req.params.studySpaceId),
        req.body.studySpaceStatusName,
        new Date(),
        new Date()
    );

    // add availability report
    // Check that all promises resolve, if one of them fails, then send error code

    // ensure these criteria are met
    let verifications = [
        studySpaceIdExists(newAR.studySpaceId),
        studySpaceIdExistsInBuilding(req.params.buildingName, newAR.studySpaceId),
        studySpaceStatusNameExists(newAR.studySpaceStatusName)
    ];

    Promise.all(verifications)
    .then(() => {
        // remove all undefined properties from the newStudySpace object, ensures only provided fields in request are set by Mongo
        // from https://stackoverflow.com/a/38340374
        Object.keys(newAR).forEach(key => newAR[key] === undefined && delete newAR[key]);

        let availabilityReports = db.collection('availabilityReports');
        // get the one latest availabiltiy report by this user on this study space
        availabilityReports.find({username: newAR.username, studySpaceId: newAR.studySpaceId}).sort({createdAt: -1}).limit(1).next(function(err, recentReport) {
            if (err) return res.status(500).end(err.message);

            // only add report if no recent reports found or the most recent report was more than X minutes ago.
            if (recentReport === null || ((new Date() - recentReport.createdAt)/(60*1000) > minutesDelay)) {
                availabilityReports.insertOne(newAR, function(err, result) {
                    if (err) return res.status(500).end(err.message);
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
        if (err) return res.status(500).end(err.message);
        return res.json(buildings);
    });
});


// get all study spaces
app.get('/api/studySpaces/', function(req, res, next) {
    db.collection('studySpaces').find({}).toArray(function(err, studySpaces) {
        if (err) return res.status(500).end(err.message);

        /* wrap the update of each study space in a promise, so we are sure that
        all the study spaces in the foreach have processed before returning the JSON */
        let promises = [];

        // add availability reports to each studySpace result
        studySpaces.forEach((studySpace) => {
            promises.push(
                getProcessedAvailabilityReports(studySpace.buildingName, studySpace._id)
                .then((r) => {
                    studySpace.rawReports = r.rawReports;
                    studySpace.isVerified = r.isVerified;
                    studySpace.studySpaceStatusName = r.studySpaceStatusName;
                })
            );
        });

        // all availability reports are added
        Promise.all(promises).then(() => {
            return res.json(studySpaces);
        });
    });
});


// get all study spaces in a building
app.get('/api/buildings/:buildingName/studySpaces/',
[
    param('buildingName').isLength({min: 1, max: 200}).trim().escape(),
],
function(req, res, next) {

    // validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMsg = buildErrorMessage(errors);
        return res.status(400).end(errorMsg);
    }

    let buildingName = req.params.buildingName;

    buildingNameExists(buildingName).then(() => {
        db.collection('studySpaces').find({buildingName: buildingName}).toArray(function(err, studySpaces) {
            if (err) return res.status(500).end(err.message);

            let promises = [];

            // add availability reports to each studySpace result
            studySpaces.forEach((studySpace) => {
                promises.push(
                    getProcessedAvailabilityReports(studySpace.buildingName, studySpace._id)
                    .then((r) => {
                        studySpace.rawReports = r.rawReports;
                        studySpace.isVerified = r.isVerified;
                        studySpace.studySpaceStatusName = r.studySpaceStatusName;
                    })
                );
            });

            // all availability reports are added
            Promise.all(promises).then(() => {
                return res.json(studySpaces);
            });
        });
    })
    .catch((rejectReason) => {
        return res.status(400).end(rejectReason.message);
    });
});

// get a study space by buildingName, and studyspace id
app.get('/api/buildings/:buildingName/studySpaces/:studySpaceId/', 
[
    param('buildingName').isLength({min: 1, max: 200}).trim().escape(),
    param('studySpaceId').isMongoId()
],
function(req, res, next) {

    // validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMsg = buildErrorMessage(errors);
        return res.status(400).end(errorMsg);
    }

    let buildingName = req.params.buildingName;
    let studySpaceId = mongo.ObjectID(req.params.studySpaceId);
    
    buildingNameExists(buildingName).then(() => {
        db.collection('studySpaces').findOne({_id: studySpaceId, buildingName: buildingName}, function(err, studySpace) {
            if (err) return res.status(500).end(err.message);
            if (studySpace === null) return res.status(404).end('Provided studySpace id does not exist');

            // add availability reports to the studySpace result
            getProcessedAvailabilityReports(buildingName, studySpaceId)
            .then((r) => {
                studySpace.rawReports = r.rawReports;
                studySpace.isVerified = r.isVerified;
                studySpace.studySpaceStatusName = r.studySpaceStatusName;
                return res.json(studySpace);
            });
        });
    })
    .catch((rejectReason) => {
        return res.status(400).end(rejectReason.message);
    });
});

// get the availability reports made for a study space in the last X minutes
app.get('/api/buildings/:buildingName/studySpaces/:studySpaceId/availabilityReports/',
[
    param('buildingName').isLength({min: 1, max: 200}).trim().escape(),
    param('studySpaceId').isMongoId()
],
function(req, res, next) {
    // validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMsg = buildErrorMessage(errors);
        return res.status(400).end(errorMsg);
    }

    let buildingName = req.params.buildingName;
    let studySpaceId = new mongo.ObjectID(req.params.studySpaceId);
    
    getAvailabilityReports(buildingName, studySpaceId).then((reports) => {
        return res.json(reports);
    }).catch((rejectReason) => {
        return res.status(400).end(rejectReason.message);
    });
});

// given a point location in geoJSON, get the closest study space
// TODO: return the point only if the study space is available
app.get('/api/closestStudySpace/',
[
    body('point').exists().not().isEmpty()
],
function(req, res, next) {
    // validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMsg = buildErrorMessage(errors);
        return res.status(400).end(errorMsg);
    }

    // the geoJSON point
    let point = req.body.point;
    
    // ensure point is an object, and fields are of correct type
    if (typeof(point) !== 'object') {return res.status(400).end('point must be an object'); }
    if (point.type !== 'Point') {return res.status(400).end('point must be of type "Point"'); }
    if (point.coordinates.length !== 2) {return res.status(400).end('coordinates must be an array of length 2 [long, lat]'); }
    if (point.coordinates[0] <= -180 || point.coordinates[0] >= 180) {return res.status(400).end('longitude must be between -180 to 180'); }
    if (point.coordinates[1] <= -90 || point.coordinates[1] >= 90) {return res.status(400).end('latitude must be between -90 to 90'); }

    // check each study space, return the one with the closest coordinates
    db.collection('studySpaces').findOne({
        polygon: {
            $nearSphere: {
                $geometry: point,
                // $minDistance: 1,
                // $maxDistance: 1000000
            }
        }
    }, function(err, studySpace) {
        if (err) return res.status(500).end(err.message);
        // add availability reports to the studySpace result
        getProcessedAvailabilityReports(studySpace.buildingName, studySpace._id)
        .then((r) => {
            studySpace.rawReports = r.rawReports;
            studySpace.isVerified = r.isVerified;
            studySpace.studySpaceStatusName = r.studySpaceStatusName;
            return res.json(studySpace);
        })
        .catch((rejectReason) => {
            return res.status(400).end(rejectReason.message);
        });
    });
});

// UPDATE ---------------------------------------------------------------------


// update a study space
app.patch('/api/buildings/:buildingName/studySpaces/:studySpaceId/',
isAuthenticated, isAdmin,
[
    param('studySpaceId').isMongoId(), // current id
    param('buildingName').isLength({min: 1, max: 200}).trim().escape(), //current buildingName
    body('name').optional().isLength({min: 1, max: 200}).trim(),
    body('description').optional().isLength({min: 1, max: 500}).trim().escape(),
    body('capacity').optional().isInt({min: 0, max: 2000}),
    body('buildingName').optional().isLength({min: 1, max: 200}).trim().escape(), // optional updated buildingName
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
        const errorMsg = buildErrorMessage(errors);
        return res.status(400).end(errorMsg);
    }

    // because imageId is turned into mongoId,
    // but is also optional, set it here, and then add to studySpace
    let imageId = req.body.imageId === undefined ? undefined : new mongo.ObjectID(req.body.imageId); 

    let newStudySpace = new StudySpace(
        new mongo.ObjectID(req.params.studySpaceId),
        req.body.name,
        req.body.description,
        req.body.capacity,
        req.body.buildingName,  // buildingName passed in body is what to update to
        req.body.polygon,
        req.body.studySpaceStatusName,
        req.body.hasOutlets,
        req.body.wifiQuality,
        req.body.groupFriendly,
        req.body.quietStudy,
        imageId,
        undefined,
        new Date() // sets updatedAt to current time
    );

    let studySpaces = db.collection('studySpaces');

    // Use Promises to do DB checks for validity of data

    // conditions to verify before attempting to update data
    let v = [];
    v.push(studySpaceIdExists(newStudySpace._id));
    if (newStudySpace.studySpaceStatusName) { v.push(studySpaceStatusNameExists(newStudySpace.studySpaceStatusName)); }
    if (newStudySpace.buildingName) { v.push(buildingNameExists(newStudySpace.buildingName)); }
    if (newStudySpace.imageId) { v.push(imageIdExists(newStudySpace.imageId)); }

    // Check that all promises resolve, if one of them fails, then send error code
    Promise.all(v)
    .then(() => {
        // remove all undefined properties from the newStudySpace object, ensures only provided fields in request are set by Mongo
        // from https://stackoverflow.com/a/38340374
        Object.keys(newStudySpace).forEach(key => newStudySpace[key] === undefined && delete newStudySpace[key]);

        // update study space record
        studySpaces.updateOne({_id: newStudySpace._id}, { $set: newStudySpace }, function(err, result) {
            if (err) return res.status(500).end(err.message);
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
app.delete('/api/buildings/:buildingName/',
isAuthenticated, isAdmin,
[
    param('buildingName').isLength({min: 1, max: 200}).trim().escape()
],
function(req, res, next) {

    // validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMsg = buildErrorMessage(errors);
        return res.status(400).end(errorMsg);
    }

    let buildings = db.collection('buildings');
    
    buildings.findOne({_id: req.params.buildingName}, function(err, building) {
        if (err) return res.status(500).end(err.message);
        if (!building) return res.status(404).end('Cannot delete building. Provided buildingName: does not exist');
        
        buildings.deleteOne({_id: building._id}, function(err) {
            if (err) return res.status(500).end(err.message);
            res.json(building);
        });
    });
});


// delete a study space
app.delete('/api/buildings/:buildingName/studySpaces/:studySpaceId/', 
isAuthenticated, isAdmin,
[
    param('studySpaceId').isMongoId(),
    param('buildingName').isLength({min: 1, max: 200}).trim().escape()
],
function(req, res, next) {
    // validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMsg = buildErrorMessage(errors);
        return res.status(400).end(errorMsg);
    }

    // declare variables for convenience
    let studySpaces = db.collection('studySpaces');
    let studySpaceId = new mongo.ObjectID(req.params.studySpaceId);
    let buildingName = req.params.buildingName;

    // find the study space, if it exists:
    studySpaces.findOne({_id: studySpaceId, buildingName: buildingName}, function(err, studySpace){
        if (err) return res.status(500).end(err.message);
        if (!studySpace) return res.status(404).end('Cannot delete studySpace. Provided studySpaceId does not exist');

        // delete the studyspace
        deleteStudySpace = new Promise((resolve, reject) => {
            studySpaces.deleteOne({_id: studySpaceId}, function(err) {
                if (err) return res.status(500).end(err.message);
                resolve();
            });
        });
        
        // TODO: delete the usersFavourites of this studySpace

        // TODO: delete studyspace reviews

        // delete availability reports of this space
        deleteAvailabilityReports = new Promise((resolve, reject) => {
            db.collection('availabilityReports').deleteMany({studySpaceId: studySpaceId}, function(err) {
                if (err) return res.status(500).end(err.message);
                resolve();
            });
        });

        let verifications = [
            deleteStudySpace,
            deleteAvailabilityReports
        ];
        Promise.all(verifications).then(() => {
            return res.json(studySpace);
        });
    });
});