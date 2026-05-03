import { NextResponse } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/register']

export function proxy(request) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('access_token')?.value
  const isPublic = PUBLIC_ROUTES.some(route => pathname.startsWith(route))

  // Redirect to dashboard if authenticated and visiting root
  if (pathname === '/' && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect to login if not authenticated and not on public route
  if (!accessToken && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
