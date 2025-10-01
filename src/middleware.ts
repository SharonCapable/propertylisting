import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Only run auth check on protected routes to improve performance
  const protectedPaths = ['/admin', '/account', '/dashboard']
  const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path))
  
  if (isProtectedPath) {
    const supabase = createMiddlewareClient({ req, res })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session && req.nextUrl.pathname !== '/login') {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  return res
}

export const config = {
  matcher: [
    // Only match protected routes and auth routes for better performance
    '/admin/:path*',
    '/account/:path*',
    '/dashboard/:path*',
    '/login',
    '/signup'
  ],
}
