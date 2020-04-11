import api from './api.js'
// Imports the Radar SDK module
import Radar from 'radar-sdk-js';

export default {
  initialize: function(){
    // Initializes SDK by passing the publishable key as a string parameter
    // TODO: Rename and set the variable below to the 'live' api key instead of 'test'
    const testPublishKey = "prj_test_pk_18eeb5f920e2f5feb64423dbb299211811bc45a0";
    Radar.initialize(testPublishKey);
  },
  setRadarUser: function(username){
    // Identifies user  when logged, stores a cookie with UUID "device ID"
		Radar.setUserId(username);
  },
  trackOnce: function(){
    let trackData = null;
    Radar.trackOnce(function(status, location, user, events) {
      // TODO: do something with status, location, user, events
      console.log("Radar: ", status, location, user, events);
      // Note that the location of the user may not be very accurate
      trackData = [status, location, user, events];
    });
    return trackData;
  },
  getUsers: function(event){

    return api().get('/api/displayUsers/')
    .then(response => {
      let result = [];
      for (var i = 0; i < response.data.length; i ++){
        result.push(response.data[i]);
      }
      return result;
    })
    .catch(function(e) {
			if (e.response) {
				event.message = e.response.data;
			}
		})
  },

  getGeofences: function(event){

    return api().get('/api/geofences/')
    .then(response => {
      let result = [];
      for (var i = 0; i < response.data.length; i ++){
        result.push(response.data[i]);
      }
      return result;
    })
    .catch(function(e) {
			if (e.response) {
				event.message = e.response.data;
			}
		})
  },

  getRadarEvents: function(event){

    return api().get('/api/events/')
    .then(response => {
      let result = [];
      for (var i = 0; i < response.data.length; i ++){
        result.push(response.data[i]);
      }
      
      return result;
    })
    .catch(function(e) {
			if (e.response) {
				event.message = e.response.data;
			}
		})
  },

  getUser: function(event){
    const cookiesStrList = document.cookie.split(';');
    const prefix = 'radar-userId';
    const usernameIndex = 1;

    var username = '';
    for (var i = 0; i < cookiesStrList.length; i ++){
      let cookieStr = cookiesStrList[i].trim();
      if (cookieStr.startsWith(prefix)) username = cookieStr.split('=')[usernameIndex];
    }
    
    return api().get('/api/user/' + username)
    .then(response => {
      return response.data.user;
    })
    .catch(function(e){
      if (e.response) {
				event.message = e.response.data;
			}
    });
  }
}
