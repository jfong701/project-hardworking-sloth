import api from './api.js'

export default {
	login: function(event, username, password) {
		api().post('/signin/', {username: username, password: password})
		.then(response => {
			this.$router.replace({ name: "Homepage" });
			response;
		})
		.catch(function(e) {
			if (e.response) {
				event.message = e.response.data;
			}
		})
	}
}