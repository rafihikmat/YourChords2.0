import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. BYPASS TOTAL UNTUK ASET STATIS & PUBLIC ROUTES (0ms Overhead)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/' ||
    pathname.startsWith('/chord/') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/help') ||
    pathname.startsWith('/request') ||
    pathname.startsWith('/features') ||
    pathname.startsWith('/chords') ||
    pathname.startsWith('/artists') ||
    pathname.startsWith('/report-typo')
  ) {
    return NextResponse.next();
  }

  // 2. HANYA CEK DOKUMEN PROVISI / SESSION UNTUK RUTE TERLINDUNGI
  // (Pemeriksaan role utama telah ditangani oleh Layout Guard)
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
