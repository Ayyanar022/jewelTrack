import {  NextRequest, NextResponse } from "next/server";



export function middleware(request:NextRequest){
    const token = request.cookies.get('token')?.value;
    const {pathname} = request.nextUrl;

    const isAuthPage = pathname.startsWith('/login') ||
                        pathname.startsWith('/register');
    
    const isDashboardPage = pathname.startsWith('/dashboard') || pathname === '/';

    // no token + trying to  access dashboard - redirect to login
    if(!token && isDashboardPage){
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // has token + trying to access login / register - > redirect to dashboard
    if(token && isAuthPage){
        return NextResponse.redirect(new URL('/dashboard',request.url));
    }


    return NextResponse.next();


}

export const config = {
    matcher:['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}