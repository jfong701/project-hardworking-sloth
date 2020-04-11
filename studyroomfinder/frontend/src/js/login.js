import api from './api.js'
// Imports the Radar SDK module
import Radar from 'radar-sdk-js';

export default {
	login: function(event, username, password) {
		api().post('/signin/', {username: username, password: password})
		.then(response => {
			event.$router.replace({ name: "Homepage" });
			// Initializes SDK by passing the publishable key as a string parameter
			// TODO: Rename and set the variable below to the 'live' api key instead of 'test'
			const testPublishKey = "prj_test_pk_18eeb5f920e2f5feb64423dbb299211811bc45a0";
			Radar.initialize(testPublishKey);
			// Identifies user  when logged, stores a cookie with UUID "device ID"
			Radar.setUserId(username);
			Radar.trackOnce(function(status, location, user, events) {
				// TODO: do something with status, location, user, events
				console.log("Radar: ", status, location, user, events);
				// Note that the location of the user may not be very accurate
			});
			response;
		})
		.catch(function(e) {
			if (e.response) {
				event.message = e.response.data;
			}
		})
	}
}