// jshint esversion: 6
let api = (function(){
    "use strict";

    let module = {};

    let userListeners = [];
    let errorListeners = [];
    // TODO: Array for building and/study space listeners
    let buildingListeners = [];

    let getUsername = function(){
        return document.cookie.replace(/(?:(?:^|.*;\s*)username\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    }

    let getBuildings = function(callback){
      send("GET", '/api/buildings/', null, callback);
    };

    function notifyUserListeners(username){
        userListeners.forEach(function(handler){
            handler(username);
        });
    };

    function notifyErrorListeners(err){
        errorListeners.forEach(function(handler){
            handler(err);
        });
    }

    // TODO: Function that notifies building listeners
    function notifyBuildingListeners(){
      getBuildings(function(err, res){
        if(err) return notifyErrorListeners(err);
        buildingListeners.forEach(function(listener){
          listener(res);
        });
      });
    }
    // TODO: Function that notifies study space listeners

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


    function send(method, url, data, callback){
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status !== 200) callback("[" + xhr.status + "]" + xhr.responseText, null);
            else callback(null, JSON.parse(xhr.responseText));
        };
        xhr.open(method, url, true);
        if (!data) xhr.send();
        else{
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(data));
        }
    }

    module.onUserUpdate = function(listener){
        userListeners.push(listener);
        listener(getUsername());
    }


    module.signin = function(username, password){
        send("POST", "/signin/", {username, password}, function(err, res){
             if (err) return notifyErrorListeners(err);
             notifyUserListeners(getUsername());
        });
    }

    module.signup = function (username, password, firstName, lastName, email, bio) {
      send("POST", '/signup/',
      {
        username,
        password,
        firstName: firstName === '' ? undefined : firstName,
        lastName: lastName ===  '' ? undefined : lastName,
        email: email === '' ? undefined : email,
        bio: bio === '' ? undefined : bio
      }, function(err, res){
        if (err) return notifyErrorListeners(err);
        notifyUserListeners(getUsername());
      });
    }

    module.signout = function() {
      send("GET", '/signout/', null, function(err, res){
        if (err) return notifyErrorListeners(err);
        notifyUserListeners(getUsername());
      });
    }

    module.onBuildingUpdate = function (listener){
        buildingListeners.push(listener);
        getBuildings(function(err, res){
          if(err) return notifyErrorListeners(err);
          listener(res);
        });
    }


    module.getBuildingStudySpaces = function(buildingName) {
      send("GET", '/api/buildings/' + buildingName + '/studySpaces/', null,
      function(err, res){
        if(err) return notifyErrorListeners(err);
        // TODO: Function to notify building listeners
        notifyBuildingListeners();
      });
    }

    // TODO: Other functions needed for searches

    module.onError = function(listener){
        errorListeners.push(listener);
    };

    // Refreshes the page every two seconds
    (function refresh(){
        setTimeout(function(e){
            // TODO: Notify listeners here to be refreshed
            refresh();
        }, 2000);
    }());

    return module;
}());
