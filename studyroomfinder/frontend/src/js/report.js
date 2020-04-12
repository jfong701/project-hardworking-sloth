import api from './api.js'

export default {
    getStudySpaces: function(event){

        return api().get('/api/studySpaces/')
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

	report: function(event, building, studySpace, studySpaceStatusName) {
		return api().post('/api/buildings/' + building + '/studySpaces/' + studySpace + '/availabilityReports/', {studySpaceStatusName: studySpaceStatusName})
		.catch(function(e) {
            if (e.response) {
                event.message = e.response.data;
            }
		})
	}
}