import axios from 'axios'

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:5000';

export default() => {
	return axios.create({
		baseURL: API_URL,
		withCredentials: true
	})
}