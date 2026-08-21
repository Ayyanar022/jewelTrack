import {  NextRequest, NextResponse } from "next/server";



export function middleware(request:NextRequest){
    const token = request.cookies.get('token')?.value;
    const {pathname} = request.nextUrl;

    const isAuthPage = pathname.startsWith('/login') ||
                        pathname.startsWith('/register');
    
    const isProtectedPage = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');

    // no token + trying to access protected page -> redirect to login
    if (!token && isProtectedPage) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // has token + trying to access login / register -> redirect to dashboard
    if (token && isAuthPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();


}

export const config = {
    matcher:['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}