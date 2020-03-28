import axios from 'axios'

const API_URL = process.env.API_URL || 'http://localhost:3000';

export default() => {
	return axios.create({
		baseURL: API_URL,
		withCredentials: true
	})
}