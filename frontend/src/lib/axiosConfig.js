import axios from 'axios'

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

axios.defaults.baseURL = backendUrl
axios.defaults.withCredentials = true

export default axios
