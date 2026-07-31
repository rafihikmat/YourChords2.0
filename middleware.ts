import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');

  if (!isAdminRoute && !isDashboardRoute) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  let token: string | undefined = undefined;

  // 1. Cek Header Authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. Cek Cookie khusus sb-access-token
  if (!token) {
    const sbAccessToken = request.cookies.get('sb-access-token')?.value;
    if (sbAccessToken) {
      token = sbAccessToken;
    }
  }

  // 3. Cek Cookie Supabase bawaan
  if (!token) {
    const cookies = request.cookies.getAll();
    const sbCookie = cookies.find(c => 
      c.name.includes('-auth-token') || 
      c.name.includes('sb-access-token') || 
      c.name === 'supabase-auth-token'
    );

    if (sbCookie) {
      try {
        const parsed = JSON.parse(sbCookie.value);
        token = parsed?.access_token || parsed[0] || sbCookie.value;
      } catch {
        token = sbCookie.value;
      }
    }
  }

  // Jika tidak ada token (Guest / Session Null)
  if (!token) {
    if (isAdminRoute) {
      const loginUrl = new URL('/auth/signin', request.url);
      loginUrl.searchParams.set('redirectTo', '/admin');
      return NextResponse.redirect(loginUrl);
    }
    if (isDashboardRoute) {
      const homeUrl = new URL('/', request.url);
      homeUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(homeUrl);
    }
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      if (isAdminRoute) {
        const loginUrl = new URL('/auth/signin', request.url);
        loginUrl.searchParams.set('redirectTo', '/admin');
        return NextResponse.redirect(loginUrl);
      }
      if (isDashboardRoute) {
        const homeUrl = new URL('/', request.url);
        homeUrl.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(homeUrl);
      }
      return NextResponse.next();
    }

    if (!user) {
      return NextResponse.next();
    }

    // Cek Role Database: Ambil role dari 'profiles'
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role || user.app_metadata?.role || 'user';


    // Rule 1: Jika Role === 'user' -> tidak boleh ke /admin
    if (role === 'user') {
      if (isAdminRoute) {
        const dashboardUrl = new URL('/dashboard', request.url);
        dashboardUrl.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(dashboardUrl);
      }
    }

    // Rule 2: Jika Role === 'admin' ATAU 'super_admin' -> redirect ke /admin jika coba ke /dashboard
    if (role === 'admin' || role === 'super_admin') {
      if (isDashboardRoute) {
        const adminUrl = new URL('/admin', request.url);
        return NextResponse.redirect(adminUrl);
      }
    }
  } catch (err) {
    console.error('[MIDDLEWARE ROLE GUARD ERROR]:', err);
    if (isAdminRoute) {
      const loginUrl = new URL('/auth/signin', request.url);
      loginUrl.searchParams.set('redirectTo', '/admin');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};

