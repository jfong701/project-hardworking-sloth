import api from './api.js'

export default {
  getUsers: function(event){

    return api().get('/api/displayUsers/')
    .then(response => {
      let result = []
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
      let result = []
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
      let result = []
      for (var i = 0; i < response.data.length; i ++){
        result.push(response.data[i]);
      }
      console.log(result);
      return result;
    })
    .catch(function(e) {
			if (e.response) {
				event.message = e.response.data;
			}
		})
  }
}
