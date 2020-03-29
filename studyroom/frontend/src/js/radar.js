import api from './api.js'

export default {
  getUsers: function(event){

    return api().get('/api/displayUsers/')
    .then(response => {
      console.log(response.data[0].location.coordinates);
      return response.data[0].location.coordinates;
    })
    .catch(function(e) {
			if (e.response) {
				event.message = e.response.data;
			}
		})
  }

}
