import api from './api.js'

export default {
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
