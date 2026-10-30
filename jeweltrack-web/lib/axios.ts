import axios from 'axios';


// helper to get cookie vale (token) )
function getCookie(name:string):string|null{
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if(parts.length===2) return parts.pop()?.split(';').shift()|| null ;
    return null
}

const getBaseURL = () => {
    // In browser, always use relative /backend-api so it routes through Next.js reverse proxy
    if (typeof window !== 'undefined') {
        return '/backend-api';
    }
    // Server-side SSR in Docker or Node
    return (
        process.env.INTERNAL_API_URL ||
        (process.env.NODE_ENV === 'production' ? 'http://api:3002' : 'http://127.0.0.1:3002')
    );
};

const api = axios.create({
    baseURL: getBaseURL(),
});

// automatically added token in every request
api.interceptors.request.use((config) => {
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