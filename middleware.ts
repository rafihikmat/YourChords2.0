import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteksi Rute Admin: Intersept seluruh permintaan yang menuju ke /admin atau /admin/*
  if (pathname.startsWith('/admin')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

    let token: string | undefined = undefined;

    // Cek header Authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Jika tidak ada di header, cari cookie Supabase
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

    // Cek Autentikasi: Jika tidak ada token/session -> Redirect ke /auth/signin?redirectTo=/admin
    if (!token) {
      const loginUrl = new URL('/auth/signin', request.url);
      loginUrl.searchParams.set('redirectTo', '/admin');
      return NextResponse.redirect(loginUrl);
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } }
      });

      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        const loginUrl = new URL('/auth/signin', request.url);
        loginUrl.searchParams.set('redirectTo', '/admin');
        return NextResponse.redirect(loginUrl);
      }

      // Cek Role Database: Ambil role dari 'profiles'
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const role = profile?.role;

      // Jika role bukan admin/super_admin -> Redirect ke beranda dengan ?error=unauthorized
      if (role !== 'admin' && role !== 'super_admin') {
        const homeUrl = new URL('/', request.url);
        homeUrl.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(homeUrl);
      }
    } catch {
      const loginUrl = new URL('/auth/signin', request.url);
      loginUrl.searchParams.set('redirectTo', '/admin');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
