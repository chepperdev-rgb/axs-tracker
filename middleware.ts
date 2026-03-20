import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/monthly', '/habits', '/planner', '/settings']

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // FIRST: Allow Stripe payment return through IMMEDIATELY — no auth check needed
  // session_id means user just completed payment on Stripe, redirect chain must not break
  const hasSessionId = request.nextUrl.searchParams.get('session_id')
  if (hasSessionId) {
    return NextResponse.next()
  }

  const { user, supabaseResponse } = await updateSession(request)

  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  // Check if current path is an auth route
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  // If user is not authenticated and trying to access protected route
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL('/login', request.url)
    const fullPath = pathname + (request.nextUrl.search || '')
    redirectUrl.searchParams.set('redirectTo', fullPath)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and trying to access auth routes
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
