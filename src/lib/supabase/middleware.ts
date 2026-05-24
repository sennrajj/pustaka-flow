import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes
  const publicRoutes = ['/login', '/']
  const isPublicRoute = publicRoutes.includes(pathname)

  // If not logged in and trying to access protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If logged in and trying to access login page
  if (user && (pathname === '/login' || pathname === '/')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const url = request.nextUrl.clone()
    if (profile?.role === 'admin') {
      url.pathname = '/admin/dashboard'
    } else if (profile?.role === 'petugas') {
      url.pathname = '/petugas/dashboard'
    } else {
      url.pathname = '/anggota/dashboard'
    }
    return NextResponse.redirect(url)
  }

  // Role-based route protection
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const role = profile?.role

    if (pathname.startsWith('/admin') && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'petugas' ? '/petugas/dashboard' : '/anggota/dashboard'
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/petugas') && role !== 'petugas' && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'admin' ? '/admin/dashboard' : '/anggota/dashboard'
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/anggota') && role !== 'anggota') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'admin' ? '/admin/dashboard' : '/petugas/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
