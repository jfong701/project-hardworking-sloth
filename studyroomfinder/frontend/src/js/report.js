import api from './api.js'

export default {
    getStudySpaces: function(event){

        return api().get('/api/studySpaces/')
        .then(response => {
          let result = []
          for (var i = 0; i < response.data.length; i ++){
            result.push(response.data[i]);
          }
          console.log(result);
          return response;
        })
        .catch(function(e) {
                if (e.response) {
                    event.message = e.response.data;
                }
            })
      },

	report: function(event, building, studySpace, availability) {
		api().post('/api/buildings/' + building + '/studySpaces/' + studySpace + '/availabilityReports/', {availability: availability})
		.catch(function(e) {
            if (e.response) {
                event.message = e.response.data;
            }
		})
	}
}