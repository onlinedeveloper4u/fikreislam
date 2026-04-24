import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect admin routes
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  // Publicly accessible auth routes (now moved out of /admin)
  // However, if the user is ALREADY logic as admin and tries to go to /login, handled?
  // User wanting to move them out of /admin prefix

  const token = req.cookies.get('session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    if (role !== 'admin' && role !== 'owner') {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
  } catch (error) {
    // Invalid token
    return NextResponse.redirect(new URL('/login', req.url));
  }
}