const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const mongo = require('mongodb');
const assert = require('assert');
const express = require('express');
const forceSslHeroku = require('force-ssl-heroku');
const cors = require('cors');
const app = express();
const { body, check, param, validationResult } = require('express-validator');
const cookie = require('cookie');
const session = require('express-session');
const bodyParser = require('body-parser');
const https = require('https');
const radar = require('radar-sdk-js');
const serveStatic = require('serve-static');
const validator = require('validator');
const WebSocket = require('ws');

// to retrieve important variables from a .env file (keeping DB credentials and others out of source code)
require('dotenv').config({path: path.resolve(__dirname, '..', '.env')});
app.use(bodyParser.json());

// time delay used for limiting availability reports, and filtering seeing only reports made for this study space
const minutesDelay = 5;
// a dict containing key-values where the key is a buildingName like 'EV'
// and the value is the timeout for the next radar update of that building
// allows for timers to be set for when the next automated update for a building should be
// (when availability resets to Unknown)
let nextRadarUpdate = {};

// key for radar.io API
const radar_secret_key = `${process.env.RADAR_SECRET_KEY}`;
const radar_publish_key = `${process.env.RADAR_PUBLISH_KEY}`;

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
const PORT = process.env.PORT || 5000;

let sessionConfig = {
    secret: `${process.env.SESSION_SECRET}`,
    resave: false,
    saveUninitialized: true,
    cookie: {
        // NOTE: coookie secure flag is set based on the production environment variable.
        sameSite: 'strict' // restrict cookie from being sent out of this site
    } 
};

if (process.env.NODE_ENV === "production") {
    // force-ssl-heroku redirects unencrypted HTTP requests to HTTPS on Heroku.
    app.use(forceSslHeroku);
    sessionConfig.cookie.secure = true; // only allow cookie over HTTPS connection
}
app.use(session(sessionConfig));

app.use(serveStatic(path.resolve(__dirname, '..', 'frontend/dist')));

const appListen = app.listen(PORT, function(err) {
    if (err) console.log(err);
    else console.log("HTTPS server on http://localhost:%s", PORT);
});

app.use(function (req, res, next){
    let username = (req.session.username)? req.session.username : '';
    res.setHeader('Set-Cookie', cookie.serialize('username', username, {
          /* httpOnly flag not set, because the front end needs access to the username
          username also is not secret information */

          secure: true, /* only attach cookies on HTTPS connection*/
          sameSite: 'strict', /* restrict cookie from being sent out of this site */
          path : '/',
          maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
    }));
    next();
    console.log("HTTP request", req.method, req.url, req.body);
});

// use cors package to allow cross origin request from Vue frontend
const whiteList = ['http://localhost:5000', 'http://localhost:8080', 'https://studyroomfinder.herokuapp.com', 'https://studyroomfinder.me'];
const corsOptions = {
    origin: function(origin, callback) {
        // console.log('this is the origin', origin);
        if (whiteList.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};
app.use(cors(corsOptions));

// WEBSOCKETS
// based on readme examples from: https://github.com/websockets/ws

let nextBroadcastWS;

const wss = new WebSocket.Server({ server: appListen });
wss.on('connection', function connection(ws, request, client) {
    // console.log('someone connected!');

    // on inital connection, send them getAllBuildings
    getAllBuildings().then(res => {
        ws.send(res);
    });

    // when receiving incoming message, it means they just reported
    // availability, send everyone back getAllBuildings to update their map
    // and minutesDelay minutes later send them back another update
    ws.on('message', function incoming(message) {
        if (message === "availabilityUpdated") {
            getAllBuildings().then(res => {
                wss.clients.forEach(function each(client) {
                    client.send(res);
                });
            }).then(() => {
                // reset the existing timer if it exists
                if (nextBroadcastWS) {
                    clearTimeout(nextBroadcastWS);
                }
            }).then(() => {
                // set the timer for 5 minutes to broadcast again everyone a building update
                nextBroadcastWS = setTimeout(() => {
                    getAllBuildings().then(res => {
                        wss.clients.forEach(function each(client) {
                            client.send(res);
                        })
                    })
                }, minutesDelay * 60 * 1000);
            });
        }
    });

    // send "ping" every 29 seconds to prevent any open connections from sleeping on Heroku
    setInterval(() => {
        // if there are any clients connected.
        wss.clients.forEach(function each(client) {
            client.send("ping");
        });
    }, 29000);

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
    constructor(_id, name, description, capacity, buildingName, polygon, hasOutlets, wifiQuality, groupFriendly, quietStudy, imageId, createdAt, updatedAt) {
        this._id = _id;
        this.name = name;
        this.description = description;
        this.capacity = capacity;
        this.buildingName = buildingName;
        this.polygon = polygon;
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

function polygonVueToGeoJSON(polygonObj) {
    // latlngs renamed to coordinates, flip the order inside each

    // make a copy of the polygon, don't mutate the original
    let pClone = JSON.parse(JSON.stringify(polygonObj));

    pClone.latlngs.forEach(c => {
        let temp = c[0];
        c[0] = c[1];
        c[1] = temp;
    });
    pClone.coordinates = [pClone.latlngs];
    delete pClone.latlngs;

    // add type for geoJSON
    pClone.type = "Polygon";

    return pClone;   
}

function polygonGeoJSONToVue(polygonObj) {
    return new Promise((resolve, reject) => {
        // rename coordinates to latlngs, flip the order inside each
        // remove the type, Vue knows its a polygon
        
        // make a copy of the polygon, don't mutate the original
        let pClone = JSON.parse(JSON.stringify(polygonObj));

        pClone.coordinates[0].forEach(c => {
            let temp = c[0];
            c[0] = c[1];
            c[1] = temp;
        });

        pClone.latlngs = pClone.coordinates[0];
        delete pClone.coordinates;
        delete pClone.type;
        
        resolve(pClone);
    });
}

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

// get overall availability status of a building based on the study spaces in it.
// find the study spaces in that building and get the most "free" status
// isVerified only true if all study spaces inside are verified
let getBuildingOverallAvailability = function(buildingName) {
    return new Promise((resolve, reject) => {
        buildingNameExists(buildingName).then(() => {
            let singleBuildingMods = [];
            let statusObj = {
                status: 'Unknown',
                isVerified: false
            };
            db.collection('studySpaces').find({buildingName: buildingName}).toArray(function(err, studySpaces) {
                if (err) return res.status(500).end(err.message);
                studySpaces.forEach((studySpace) => {
                    singleBuildingMods.push(
                        getProcessedAvailabilityReports(studySpace.buildingName, studySpace._id)
                        .then((r) => {
                            let status = r.studySpaceStatusName;
                            if (status === 'Available') {
                                statusObj.status = 'Available';
                            } else if (status === 'Nearly Full' && statusObj.status !== 'Available') {
                                statusObj.status = 'Nearly Full';
                            } else if (status === 'Full' && statusObj.status === 'Unknown') {
                                statusObj.status = 'Full';
                            }
                            statusObj.isVerified = statusObj.isVerified || r.isVerified ? true : false;
                        })
                    );
                });
                Promise.all(singleBuildingMods).then(() => {
                    resolve(statusObj);
                });
            });
        })
        .catch((rejectReason) => {
            reject(new Error(rejectReason.message));
        });
    });
};

// RADAR HELPERS

// Update Radar's building geofences with the latest availability reports
// optional parameter buildingName. if buildingName not provided updates all buildings.
function updateRadarAvailabilityReports(buildingName) {
    // default: update all geofences.
    let url = 'https://api.radar.io/v1/geofences';
    if (buildingName) {
        // if building name provided, get only that geofence
        url = 'https://api.radar.io/v1/geofences/building/' + buildingName;
    }
    // Get the existing geofences
    const options = {
        method: 'GET',
        headers: {
            'Authorization': radar_secret_key
        }
    };
    let dataStr = '';

    new Promise((resolve, reject) => {
        https.request(url, options, (response) => {
            response
            .on('data', chunk => {
                dataStr += chunk;
            })
            .on('end', () => {
                if (buildingName) {
                    resolve([JSON.parse(dataStr).geofence]);
                } else {
                    resolve(JSON.parse(dataStr).geofences);
                }
            });
        })
        .on('error', err => {
            console.error(err);
        })
        .end();
    })
    // foreach geofence, update the metadata to add/update status and isVerified and send a new request.
    .then(geofences => {
        // ensure database connection has been established first
        if (db !== undefined) {
            geofences.forEach(geofence => {
                getBuildingOverallAvailability(validator.escape(geofence.externalId))
                // retrieve the status from backend and add to geofence
                .then(statusObj => {
                    // add status to metadata
                    let md = geofence.metadata;
                    md.status = statusObj.status;
                    md.isVerified = statusObj.isVerified;
                    geofence.metadata = md;

                    // move data to different fields for PUT
                    if (geofence.type === 'circle' || geofence.type === 'isochrone') {
                        geofence.coordinates = geofence.geometryCenter.coordinates;
                    } else if (geofence.type === 'polygon') {
                        geofence.coordinates = geofence.geometry.coordinates[0];
                    }
                    geofence.radius = geofence.geometryRadius;

                    // remove fields we received in GET, but shouldn't send back in the PUT request
                    delete geofence._id;
                    delete geofence.geometryCenter;
                    delete geofence.live;
                    delete geofence.createdAt;
                    delete geofence.updatedAt;
                    delete geofence.geometry;
                    delete geofence.geometryRadius;
                    delete geofence.mode;
                    return geofence;
                })
                // set request headers and send PUT to update this geofence
                .then((geofence) => {
                    const g = JSON.stringify(geofence);
                    // configure request headers
                    const postUrl = 'https://api.radar.io/v1/geofences/' + geofence.tag + '/' + geofence.externalId;
                    const postOptions = {
                        method: 'PUT',
                        headers: {
                            'Authorization': radar_secret_key,
                            'Content-Type': 'application/json',
                            'Content-Length': g.length
                        }
                    };
                    // define request
                    const postReq = https.request(postUrl, postOptions, (response) => {
                        response
                        .on('data', chunk => {
                            console.log('chunk out (' + geofence.externalId + ')', chunk); // log chunks as they go out
                        });
                    });

                    postReq.on('error', err => {
                        console.error(err);
                    });

                    postReq.write(g); // send the request out
                    postReq.end();
                });
            });
        }
    });
}


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
                secure: true, /* only attach cookies on HTTPS connection*/
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
        secure: true, /* only attach cookies on HTTPS connection*/
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

    // process the polygon vue entry (lat,long) to follow geoJSON (long, lat)
    let originalPolygon = req.body.polygon;
    let polygon = polygonVueToGeoJSON(originalPolygon);

    let newStudySpace = new StudySpace(
        undefined,
        req.body.name,
        req.body.description,
        req.body.capacity,
        req.params.buildingName,
        polygon,
        req.body.hasOutlets,
        req.body.wifiQuality,
        req.body.groupFriendly,
        req.body.quietStudy,
        imageId,
        new Date(),
        new Date()
    );
    
    // ensure buildingName and imageId are valid
    let v = [
        buildingNameExists(newStudySpace.buildingName)
    ];

    if (!isNullOrUndef(newStudySpace.imageId)) {
        v.push(imageIdExists(newStudySpace.imageId));
    }

    Promise.all(v).then(() => {
        // insert study space
        db.collection('studySpaces').insertOne(newStudySpace, function(err, result) {
            if (err) return res.status(500).end(err.message);

            new Promise((resolve, reject) => {
                // let the frontend see the format that it sent in
                newStudySpace.polygon = originalPolygon;
                resolve(newStudySpace);
            }).then((a) => {
                return res.json(a);
            });
        });
    }).catch((rejectReason) => {
        // any of the promises rejected, then data is invalid, send a 400 response with the reason
        return res.status(400).end(rejectReason.message);
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

    let buildingName = req.params.buildingName;

    // add availability report
    // Check that all promises resolve, if one of them fails, then send error code

    // ensure these criteria are met
    let verifications = [
        studySpaceIdExists(newAR.studySpaceId),
        studySpaceIdExistsInBuilding(buildingName, newAR.studySpaceId),
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
                    
                    // update availability report on radar
                    new Promise((resolve, reject) => {
                        resolve(updateRadarAvailabilityReports(buildingName));
                    }).then(() => {
                        // if there is an existing timer for this study space, remove it so we can extend it
                        if (nextRadarUpdate && nextRadarUpdate[buildingName]) {
                            clearTimeout(nextRadarUpdate[buildingName]);
                        }
                    })
                    .then(() => {
                        // set the next update period for this building (minutesDelay minutes from now)
                        nextRadarUpdate[buildingName] = setTimeout(() => {
                            updateRadarAvailabilityReports(buildingName);
                        }, minutesDelay * 60 * 1000);
                    }).then(() => {
                        return res.json(newAR);
                    });
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


// get all buildings moved to outside function to allow access by websockets
app.get('/api/buildings/', function(req, res, next) {
    return getAllBuildings(req, res, next);
});
function getAllBuildings(req, res, next) {
    return new Promise((resolve, reject) => {
        db.collection('buildings').find({}).toArray(function(err, buildings) {
            if (err) return res.status(500).end(err.message);
    
            let buildingsUpdated = [];
            buildings.forEach((building) => {
                // find the study spaces in that building and get the most "free" status
                // isVerified only true if all study spaces inside are verified
                building.isVerified = false;
                building.status = 'Unknown';
    
                buildingsUpdated.push(
                    getBuildingOverallAvailability(building._id)
                    .then((statusObj)=> {
                        building.isVerified = statusObj.isVerified;
                        building.status = statusObj.status;
                        return building;
                    })
                );
            });
    
            // modifications complete for all buildings.
            Promise.all(buildingsUpdated).then(()=> {
                if (res) {
                    return res.json(buildings);
                } else {
                    resolve(JSON.stringify(buildings));
                }
            })
            .catch((rejectReason) => {
                if (res) {
                    return res.status(400).end(rejectReason.message);
                } else {
                    return JSON.stringify(rejectReason.message);
                }
            });
        });
    });
}

// get a single building
app.get('/api/buildings/:buildingName/', [
    param('buildingName').isLength({min: 1, max: 200}).trim().escape(),
], function(req, res, next) {
    let buildingName = req.params.buildingName;
    
    buildingNameExists(buildingName).then(() => {
        db.collection('buildings').findOne({_id: buildingName}, function(err, building) {
            if (err) return res.status(500).end(err.message);
    
            getBuildingOverallAvailability(buildingName)
            .then((statusObj)=> {
                building.isVerified = statusObj.isVerified;
                building.status = statusObj.status;
                return building;
            })
            .then((building) => {
                return res.json(building);
            });
        });
    })
    .catch((rejectReason) => {
        return res.status(400).end(rejectReason.message);
    });
});


// get all study spaces
app.get('/api/studySpaces/', function(req, res, next) {
    return getAllStudySpaces(req, res, next);
});

// moved to helper to allow access for websockets
function getAllStudySpaces(req, res, next) {
    return new Promise((resolve, reject) => {
        db.collection('studySpaces').find({}).toArray(function(err, studySpaces) {
            if (err) return res.status(500).end(err.message);

            /* wrap the update of each study space in a promise, so we are sure that
            all the study spaces in the foreach have processed before returning the JSON */
            let modifications = [];

            // add availability reports to each studySpace result
            studySpaces.forEach((studySpace) => {
                modifications.push(
                    getProcessedAvailabilityReports(studySpace.buildingName, studySpace._id)
                    .then((r) => {
                        studySpace.rawReports = r.rawReports;
                        studySpace.isVerified = r.isVerified;
                        studySpace.studySpaceStatusName = r.studySpaceStatusName;
                    })
                );
                modifications.push(
                    // convert geoJSON to the format Vue Leaflet uses
                    polygonGeoJSONToVue(studySpace.polygon)
                    .then((p) => {
                        studySpace.polygon = p;
                    })
                );
            });

            // all modifications made
            Promise.all(modifications).then(() => {
                console.log(modifications);
                if (res) {
                    return res.json(studySpaces);
                } else {
                    resolve(JSON.stringify(studySpaces));
                }
            })
            .catch((rejectReason) => {
                if (res) {
                    return res.status(400).end(rejectReason.message);
                } else {
                    return JSON.stringify(rejectReason.message);
                }
            });
        });
    });
}


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

            let modifications = [];

            // for each result, do the following modifications
            studySpaces.forEach((studySpace) => {
                // add availability reports
                modifications.push(
                    getProcessedAvailabilityReports(studySpace.buildingName, studySpace._id)
                    .then((r) => {
                        studySpace.rawReports = r.rawReports;
                        studySpace.isVerified = r.isVerified;
                        studySpace.studySpaceStatusName = r.studySpaceStatusName;
                    })
                );
                modifications.push(
                    // convert geoJSON to the format Vue Leaflet uses
                    polygonGeoJSONToVue(studySpace.polygon)
                    .then((p) => {
                        studySpace.polygon = p;
                    })
                );
            });

            // all modifications made
            Promise.all(modifications).then(() => {
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

            let modifications = [];

            // convert geoJSON to the format Vue Leaflet uses
            modifications.push(
                polygonGeoJSONToVue(studySpace.polygon)
                .then((p) => {
                    studySpace.polygon = p;
                })
            );

            // add availability reports to the studySpace result
            modifications.push(
                getProcessedAvailabilityReports(buildingName, studySpaceId)
                .then((r) => {
                    studySpace.rawReports = r.rawReports;
                    studySpace.isVerified = r.isVerified;
                    studySpace.studySpaceStatusName = r.studySpaceStatusName;
                })
            );

            Promise.all(modifications).then(() => {
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

        // apply modifications to studySpace object before returning it
        let modifications = [];

        // convert geoJSON to the format Vue Leaflet uses
        modifications.push(
            polygonGeoJSONToVue(studySpace.polygon)
            .then((p) => {
                studySpace.polygon = p;
            })
        );

        // add availability reports to the studySpace result
        modifications.push(
            getProcessedAvailabilityReports(studySpace.buildingName, studySpace._id)
            .then((r) => {
            studySpace.rawReports = r.rawReports;
            studySpace.isVerified = r.isVerified;
            studySpace.studySpaceStatusName = r.studySpaceStatusName;
            })
        );

        Promise.all(modifications).then(() => {
            return res.json(studySpace);
        })
        .catch((rejectReason) => {
            return res.status(400).end(rejectReason.message);
        });
    });
});

// TODO: Code below was helped from source below
// https://www.freecodecamp.org/forum/t/node-express-passing-request-headers-in-a-get-request/235160/4
app.get('/api/displayUsers/', function(req, res, next) {

    let url = "https://api.radar.io/v1/users";
    var options = {
      method: "GET",
      headers: {
        "Authorization": radar_secret_key
      }
    };

    let dataStr = "";

    let radarReq = https.request(url, options, function(response){
      response.on("data", chunk => {
        dataStr += chunk;
      });
      response.on("end", () => {
        console.log("Radar data recieved.");
        let radarData = JSON.parse(dataStr);
        let users = radarData.users;
        res.end(JSON.stringify(users));
      });
    });
    radarReq.end();
});


// Lists geofences sorted in decending order at the time they were created
app.get('/api/geofences/', function(req, res){
  let url = "https://api.radar.io/v1/geofences";
  var options = {
    method: "GET",
    headers: {
      "Authorization": radar_secret_key
    }
  };

  let dataStr = "";

  let radarReq = https.request(url, options, function(response){
    response.on("data", chunk => {
      dataStr += chunk;
    });
    response.on("end", () => {
      console.log("Radar geofences data recieved.");
      let radarData = JSON.parse(dataStr);
      let geofences = radarData.geofences;
      res.end(JSON.stringify(geofences));
    });
  });
  radarReq.end();
});

// Lists Radar events sorted in decending order at the time they were created
app.get('/api/events/', function(req, res){
  let url = "https://api.radar.io/v1/events";
  var options = {
    method: "GET",
    headers: {
      "Authorization": radar_secret_key
    }
  };

  let dataStr = "";

  let radarReq = https.request(url, options, function(response){
    response.on("data", chunk => {
      dataStr += chunk;
    });
    response.on("end", () => {
      console.log("Radar events data recieved.");
      let radarData = JSON.parse(dataStr);
      let events = radarData.events;
      res.end(JSON.stringify(events));
    });
  });
  radarReq.end();
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
    let originalPolygon = req.params.polygon;
    let polygon = polygonVueToGeoJSON(originalPolygon);

    let newStudySpace = new StudySpace(
        new mongo.ObjectID(req.params.studySpaceId),
        req.body.name,
        req.body.description,
        req.body.capacity,
        req.body.buildingName,  // buildingName passed in body is what to update to
        polygon,
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
            
            new Promise((resolve, reject) => {
                // ensure the frontend only sees the polygon in the form that it sent it in as
                newStudySpace.polygon = originalPolygon;
                resolve(newStudySpace);
            }).then((a) => {
                return res.json(a);
            });
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
