import axios from 'axios';


const api = axios.create({
    baseURL:'http://localhost:3000',
})

// automatically added token in every request 
api.interceptors.request.use((config)=>{
    const token = localStorage.getItem('token');
    if(token){
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})


// handle token expiry globally 
api.interceptors.response.use(
    (Response)=>Response,
    (error)=>{
        if(error.response?.this.status === 401 ){
            localStorage.removeItem('token');
            window.location.href = '/login' ;
        }
        return Promise.reject(error)
    }
)



export default api;