import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'


export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const shouldProxy = [
    '/admin',
    '/settings',
    '/library',
    '/qa',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password'
  ].some(path => pathname.startsWith(path))

  if (!shouldProxy) return NextResponse.next()

  let res = NextResponse.next({
    request: { headers: req.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return req.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options })
          res = NextResponse.next({ request: { headers: req.headers } })
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: '', ...options })
          res = NextResponse.next({ request: { headers: req.headers } })
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Use getUser() for security as recommended by Supabase
  const { data: { user } } = await supabase.auth.getUser()

  const isAdminRoute = pathname.startsWith('/admin')
  const isUserProtectedRoute = ['/settings', '/library', '/qa'].some(p => pathname.startsWith(p))
  const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password'].some(p => pathname.startsWith(p))

  if ((isAdminRoute || isUserProtectedRoute) && !user) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Admin Check
  if (isAdminRoute && user) {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleData?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}