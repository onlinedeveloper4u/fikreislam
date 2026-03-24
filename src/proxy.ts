import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default async function proxy(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Protected Routes Configuration
  const isAdminRoute = pathname.startsWith('/admin')
  const isUserProtectedRoute = pathname.startsWith('/settings') || pathname.startsWith('/library') || pathname.startsWith('/qa')
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password')

  // 1. Redirect unauthenticated users from protected routes
  if ((isAdminRoute || isUserProtectedRoute) && !session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 2. Role-based access for Admin routes
  if (isAdminRoute && session) {
    // Check role from user_roles table
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (roleData?.role !== 'admin') {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // 3. Redirect authenticated users away from auth routes
  if (isAuthRoute && session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/settings/:path*',
    '/library/:path*',
    '/qa/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ],
}
