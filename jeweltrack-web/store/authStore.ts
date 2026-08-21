import { Shop, User } from "@/types";
import { create } from "zustand";

// helper to read cookies 
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
}

function getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem('jeweltrack_user');
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

interface AuthState {
    token: string | null;
    user: User | null;
    shop: Shop | null;
    setToken: (token: string) => void;
    setUser: (user: User | null) => void;
    setShop: (shop: Shop | null) => void;
    logout: () => void;
    isAuthenticated: () => boolean;
    isSuperAdmin: () => boolean;
    isShopOwner: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    token: getCookie('token'),
    user: getStoredUser(),
    shop: getStoredUser()?.shop || null,

    setToken: (token: string) => {
        document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
        }
        set({ token });
    },
    
    setUser: (user: User | null) => {
        if (typeof window !== 'undefined') {
            if (user) {
                localStorage.setItem('jeweltrack_user', JSON.stringify(user));
                document.cookie = `user_role=${user.role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
            } else {
                localStorage.removeItem('jeweltrack_user');
                document.cookie = `user_role=; path=/; max-age=0`;
            }
        }
        set({ user, shop: user?.shop || null });
    },

    setShop: (shop: Shop | null) => {
        set({ shop });
    },

    logout: () => {
        document.cookie = `token=; path=/; max-age=0`;
        document.cookie = `user_role=; path=/; max-age=0`;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('jeweltrack_user');
        }
        set({ token: null, user: null, shop: null });
    },

    isAuthenticated: () => {
        return !!get().token || (typeof window !== 'undefined' && !!localStorage.getItem('token'));
    },

    isSuperAdmin: () => {
        return get().user?.role === 'SUPER_ADMIN';
    },

    isShopOwner: () => {
        return get().user?.role === 'SHOP_OWNER';
    },
}));