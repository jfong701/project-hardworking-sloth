// jshint esversion: 6
(function(){
  "use strict";

  api.onUserUpdate(function(username){
    // TODO: Methods for content visibility based on given user
    document.querySelector("#signin").style.visibility = (username)? 'hidden' : 'visible';
    document.querySelector("#signup").style.visibility = (username)? 'hidden' : 'visible';
    document.querySelector("#signout").style.visibility = (username)? 'visible' : 'hidden';

  });

  document.getElementById("signout").addEventListener('click', function(e) {
    // TODO: Check if works as expected
    api.signout();
  });

  // TODO: Change functions below for searching --------------------------------
  function search(){
      console.log(document.querySelector("#search_bar").checkValidity());
      if (document.querySelector("#search_bar").checkValidity()){
          var buildingName = document.querySelector("input [name=search_bar]").value;
          // TODO: Below is a temporary api call, actual search will have different call
          api.getBuildingStudySpaces(buildingName);
      }
  }

  document.getElementById("search_bar").addEventListener('submit', function(e){
    e.preventDefault();
    search();
  });

  document.getElementById("search_button").addEventListener('click', function(e){
    search();
  });

}());
