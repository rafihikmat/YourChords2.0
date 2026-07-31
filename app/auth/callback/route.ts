import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data?.session) {
        const maxAge = 604800; // 7 days
        const response = NextResponse.redirect(new URL(next, request.url));
        response.cookies.set('sb-access-token', data.session.access_token, {
          path: '/',
          maxAge,
          sameSite: 'lax',
        });
        response.cookies.set('sb-refresh-token', data.session.refresh_token, {
          path: '/',
          maxAge,
          sameSite: 'lax',
        });
        return response;
      }
    } catch (err) {
      console.error('[AUTH CALLBACK ERROR]:', err);
    }
  }

  // Fallback redirect
  return NextResponse.redirect(new URL(next, request.url));
}
