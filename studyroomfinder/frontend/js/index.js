// jshint esversion: 6
(function(){
  "use strict";

  api.onUserUpdate(function(username){
    // TODO: Methods for content visibility based on given user
    document.querySelector("#signin").style.visibility = (username)? 'hidden' : 'visible';
    document.querySelector("#signup").style.visibility = (username)? 'hidden' : 'visible';
    document.querySelector("#signout").style.visibility = (username)? 'visible' : 'hidden';
    document.querySelector("#signout").innerHTML = (username)? 'Sign out' : '';
  });

  // TODO: Update below to display results based on user search
  api.onBuildingUpdate(function(buildings){
    document.querySelector('#search_results').innerHTML = '';
    buildings.forEach(function(building){
      var elmt = document.createElement('div');
      elmt.className = "building";
      elmt.id = "building" + building._id;
      elmt.innerHTML=`
        <p>${building.name}</p>
        <p>${building.description}</p>
      `;
      document.querySelector("#search_results").prepend(elmt);
    });
  });

  document.getElementById("signout").addEventListener('click', function(e) {
    // TODO: Check if works as expected
    api.signout();

  });

  // TODO: Change functions below for searching --------------------------------
  function search(){
      console.log(document.querySelector("form").checkValidity());
      if (document.querySelector("form").checkValidity()){
          var buildingName = document.querySelector("#search_bar").value;
          // TODO: Below is a temporary api call, actual search will have different call
          api.getBuildingStudySpaces(buildingName);
      }
  }

  document.getElementById("search_button").addEventListener('click', function(e){
    search();
  });

  document.querySelector('form').addEventListener('submit', function(e){
      e.preventDefault();
  });

}());
