// jshint esversion: 6
(function(){
  "use strict";

  api.onUserUpdate(function(username){
    // TODO: Methods for content visibility based on given user
    document.querySelector("#signin").style.visibility = (username)? 'hidden' : 'visible';
    document.querySelector("#signup").style.visibility = (username)? 'hidden' : 'visible';
    document.querySelector("#signout").style.visibility = (username)? 'visible' : 'hidden';

  });

  document.getElementById("signout").addEventListener("click", function(e) {
    // TODO: Check if works as expected
    api.signout();
  });

}());
