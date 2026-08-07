import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Daftar path terlarang / file sensitif & dotfile patterns
const BLOCKED_PREFIXES = [
  '/.git',
  '/.env',
  '/.config',
  '/.vscode',
  '/.idea',
  '/.svn',
  '/.hg',
  '/.htaccess',
  '/.aws',
  '/.docker',
  '/.ssh',
  '/.bash',
  '/.zsh',
  '/.npm',
  '/.yarn',
];

// Regex untuk ekstensi file publik yang aman untuk diloloskan
const SAFE_STATIC_EXTENSIONS = /\.(png|jpe?g|svg|ico|css|js|json|woff2?|ttf|eot|mp3|wav|webp|avif|pdf|txt|xml|manifest)$/i;

/**
 * Memeriksa apakah pathname mencoba mengakses dotfile sensitif atau direktori tersembunyi
 */
function isForbiddenPath(pathname: string): boolean {
  const normalizedPath = pathname.toLowerCase();

  // 1. Cek prefix terlarang spesifik (misal /.git, /.env, /.vscode, dll)
  for (const prefix of BLOCKED_PREFIXES) {
    if (normalizedPath.startsWith(prefix) || normalizedPath.includes(prefix + '/')) {
      return true;
    }
  }

  // 2. Cek pattern dotfile umum: rute yang memiliki segmen diawali titik (misal /foo/.bar)
  // Catatan: rute Next.js internal diawali '/_next' (garis bawah), bukan titik ('.')
  const pathSegments = normalizedPath.split('/');
  for (const segment of pathSegments) {
    if (segment.startsWith('.') && segment !== '.' && segment !== '..') {
      return true;
    }
  }

  return false;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. PENCEGATAN KEAMANAN TINGKAT PERTAMA (SERVER GUARD)
  // Mengembalikan HTTP 404 Not Found instan untuk semua request dotfile / Git / Env
  if (isForbiddenPath(pathname)) {
    return new NextResponse('404 Not Found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  // 2. BYPASS UNTUK ASET STATIS NEXT.JS & PUBLIC ROUTES SAFELIST (0ms Overhead)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    SAFE_STATIC_EXTENSIONS.test(pathname) ||
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

  // 3. RUTE TERLINDUNGI & DEFAULT HANDLING
  return NextResponse.next();
}

// Alias untuk middleware & default export agar kompatibel di berbagai versi Next.js
export const middleware = proxy;
export default proxy;

export const config = {
  matcher: ['/:path*'],
};
