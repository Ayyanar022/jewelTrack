import axios from 'axios';


// helper to get cookie vale (token) )
function getCookie(name:string):string|null{
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if(parts.length===2) return parts.pop()?.split(';').shift()|| null ;
    return null
}

const api = axios.create({
    baseURL:'http://localhost:4000',
})

// automatically added token in every request 
api.interceptors.request.use((config)=>{
    const token = getCookie('token')
    if(token){
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})


// handle token expiry globally 
api.interceptors.response.use(
    (Response)=>Response,
    (error)=>{
        if(error.response?.status === 401 ){
           document.cookie = `token=; path=/; max-age=0`;
            window.location.href = '/login' ;
        }
        return Promise.reject(error)
    }
)



export default api;