import api from './api.js'

export default {
	signup: function(event, username, password) {
		api().post('/signup/', {username: username, password: password})
		.then(response => {
			if (response.status == '200') {
				event.$router.replace({ name: "Login" });
			}
		})
		.catch(function(e) {
            if (e.response) {
                event.message = e.response.data;
            }
		})
	}
}