import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that require authentication
// NOTE: /dashboard excluded — handles auth client-side to support Stripe payment return
const protectedRoutes = ['/monthly', '/habits', '/planner', '/settings']

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // FIRST: Allow Stripe payment return through IMMEDIATELY — no auth check needed
  // Check both URL param (initial redirect) AND cookie (RSC follow-up requests)
  const hasSessionId = request.nextUrl.searchParams.get('session_id')
  const hasPaymentCookie = request.cookies.get('stripe_payment_success')?.value === '1'
  if (hasSessionId || hasPaymentCookie) {
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
