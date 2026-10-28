import axios from 'axios';


// helper to get cookie vale (token) )
function getCookie(name:string):string|null{
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if(parts.length===2) return parts.pop()?.split(';').shift()|| null ;
    return null
}

const getBaseURL = () => {
    if (typeof window !== 'undefined') {
        const envUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
            if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                return `${window.location.protocol}//${window.location.hostname}:3002`;
            }
        }
        return envUrl || `${window.location.protocol}//${window.location.hostname}:3002`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
};

const api = axios.create({
    baseURL: getBaseURL(),
});

// automatically added token in every request & ensure baseURL matches host
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            if (!config.baseURL || config.baseURL.includes('localhost') || config.baseURL.includes('127.0.0.1')) {
                config.baseURL = `${window.location.protocol}//${window.location.hostname}:3002`;
            }
        }
    }
    const token = getCookie('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});


// handle token expiry globally 
api.interceptors.response.use(
    (Response) => Response,
    (error) => {
        const isAuthRequest =
            error.config?.url?.includes('/auth/login') ||
            error.config?.url?.includes('/auth/register');

        if (error.response?.status === 401 && !isAuthRequest) {
            document.cookie = `token=; path=/; max-age=0`;
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
)


export default api;