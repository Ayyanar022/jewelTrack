import { Shop } from "@/types";
import { skipToken } from "@tanstack/react-query";



interface AuthState{
    token :string |null;
    shop :Shop |null;
    setToken : (token:string) =>void;
    setShop : (shop:Shop)=>void ;
    logout : ()=>void;
    isAuthenticated:()=>boolean;
}


export const useAuthStore = create<AuthState>((set,get)=>({
    token:null,
    shop:null,

    setToken: (token:string)=>{
        localStorage.setItem('token',token);
        set({token});
    },
    setShop:(shop:Shop)=>{
        set({shop})
    },
    logout:()=>{
        localStorage.removeItem('token');
        set({token:null, shop:null});
    },

    isAuthenticated:()=>{
        return !! get().token || !!localStorage.getItem('token');
    },
}))