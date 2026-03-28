import { Shop } from "@/types";
import { create } from "zustand";



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
        // localStorage.setItem('token',token);
        document.cookie = `token=${token}; path=/; max-age=${60* 60 * 24}` ;
        set({token});
    },
    setShop:(shop:Shop)=>{
        set({shop})
    },
    logout:()=>{
        // localStorage.removeItem('token');
        document.cookie = `token=; path=/; max-age=0` ;
        set({token:null, shop:null});
    },

    isAuthenticated:()=>{
        return !! get().token || !!localStorage.getItem('token');
    },
}))