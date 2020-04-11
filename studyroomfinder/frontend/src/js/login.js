import api from './api.js'
import Radar from './radar.js'

export default {
	login: function(event, username, password) {
		api().post('/signin/', {username: username, password: password})
		.then(response => {
			event.$router.replace({ name: "Homepage" });
			Radar.initialize();
			Radar.setRadarUser(username);
			Radar.trackOnce();
			response;
		})
		.catch(function(e) {
			if (e.response) {
				event.message = e.response.data;
			}
		})
	}
}