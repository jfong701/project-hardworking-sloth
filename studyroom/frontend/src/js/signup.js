import api from '.api'

export default {
	register: function(event, username, password) {
		api().post('/signup/', {username: username, password: password})
		.then(response => {
			if (response.status == '200') {
				window.location.href = "/login";
				//event.$router.push('/')
			}
		})
		.catch(function(e) {
            if (e.response) {
                event.message = e.response.data;
            }
		})
	}
}