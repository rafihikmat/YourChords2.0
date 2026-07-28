import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { supabase } from '@/lib/supabase';
import { verifyAdminAccess } from '@/lib/authAdmin';

export async function GET(request: Request) {
  // 1. VERIFIKASI KEAMANAN HAK AKSES ADMIN
  const authHeader = request.headers.get('authorization');
  let token = authHeader?.replace('Bearer ', '');

  if (!token) {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:sb-access-token|supabase-auth-token|auth-token)=([^;]+)/);
      if (match) {
        try {
          const parsed = JSON.parse(decodeURIComponent(match[1]));
          token = parsed?.access_token || parsed[0] || match[1];
        } catch {
          token = decodeURIComponent(match[1]);
        }
      }
    }
  }

  const access = await verifyAdminAccess(token);

  if (!access.isAdmin) {
    return NextResponse.json(
      { success: false, error: "Akses ditolak. Membutuhkan hak akses admin." },
      { status: 403 }
    );
  }

  // 2. PARSE PARAMETER URL
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  // Validasi Ketersediaan URL
  if (!targetUrl) {
    return NextResponse.json(
      { success: false, error: 'URL parameter tidak ditemukan. Harap masukkan URL.' }, 
      { status: 400 }
    );
  }

  // Validasi Domain
  if (!targetUrl.toLowerCase().includes('chordtela.com')) {
    return NextResponse.json(
      { success: false, error: 'Hanya URL dari domain chordtela.com yang didukung saat ini.' }, 
      { status: 400 }
    );
  }

  try {
    // Helper function for fetching URL with 4-Tier Multi-Proxy Fallback
    const fetchHtmlContent = async (url: string): Promise<string> => {
      // TIER 1: Googlebot Crawler Bypass
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          },
          cache: 'no-store',
        });

        if (res.ok) {
          const html = await res.text();
          if (html && html.trim().length > 100) {
            return html;
          }
        } else {
          console.warn(`[SCRAPER TIER 1 WARN]: Googlebot direct fetch failed HTTP ${res.status}. Trying Tier 2 (CodeTabs)...`);
        }
      } catch (err: any) {
        console.warn(`[SCRAPER TIER 1 ERROR]: Googlebot fetch error: ${err?.message}. Trying Tier 2 (CodeTabs)...`);
      }

      // TIER 2: CodeTabs Proxy
      try {
        const codeTabsUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
        const res = await fetch(codeTabsUrl, {
          method: 'GET',
          cache: 'no-store',
        });

        if (res.ok) {
          const html = await res.text();
          if (html && html.trim().length > 100) {
            return html;
          }
        } else {
          console.warn(`[SCRAPER TIER 2 WARN]: CodeTabs failed HTTP ${res.status}. Trying Tier 3 (AllOrigins JSON)...`);
        }
      } catch (err: any) {
        console.warn(`[SCRAPER TIER 2 ERROR]: CodeTabs error: ${err?.message}. Trying Tier 3 (AllOrigins JSON)...`);
      }

      // TIER 3: AllOrigins JSON Proxy
      try {
        const allOriginsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const res = await fetch(allOriginsUrl, {
          method: 'GET',
          cache: 'no-store',
        });

        if (res.ok) {
          const json = await res.json();
          if (json?.contents && json.contents.trim().length > 100) {
            return json.contents;
          }
        } else {
          console.warn(`[SCRAPER TIER 3 WARN]: AllOrigins failed HTTP ${res.status}. Trying Tier 4 (Bingbot)...`);
        }
      } catch (err: any) {
        console.warn(`[SCRAPER TIER 3 ERROR]: AllOrigins error: ${err?.message}. Trying Tier 4 (Bingbot)...`);
      }

      // TIER 4: Bingbot Fallback
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          },
          cache: 'no-store',
        });

        if (res.ok) {
          const html = await res.text();
          if (html && html.trim().length > 100) {
            return html;
          }
        }
        throw new Error(`Bingbot HTTP ${res.status}`);
      } catch (err: any) {
        console.error(`[SCRAPER TIER 4 ERROR]: Bingbot error: ${err?.message}`);
        throw new Error(`Gagal menyedot halaman dari URL target via Googlebot/Bingbot maupun Proxy CodeTabs/AllOrigins (${err?.message || '403 Forbidden'}).`);
      }
    };

    const html = await fetchHtmlContent(targetUrl);
    
    // Parsing dokumen HTML menggunakan Cheerio
    const $ = cheerio.load(html);

    // Ambil Judul Halaman dari tag h1.entry-title
    const pageTitleRaw = $('h1.entry-title').text() || $('title').text() || "Tanpa Judul";
    
    // Data Sanitization: Memisahkan Artis dan Judul Lagu (Asumsi Format Chordtela: "Artis - Judul")
    let artist = "Unknown Artist";
    let title = pageTitleRaw.trim();
    
    if (pageTitleRaw.includes(' - ')) {
      const parts = pageTitleRaw.split('-');
      artist = parts[0].trim();
      title = parts.slice(1).join('-').replace(/\s*Chords?\b/i, '').trim();
    }

    artist = artist.replace(/Chord Kunci Gitar\s*/i, '').replace(/^Chord\s+/i, '').trim();
    title = title.replace(/Chord Kunci Gitar\s*/i, '').replace(/\s*-\s*Chordtela.*/i, '').replace(/\s*Chordtela\.com.*/i, '').trim();

    // Ekstraksi Chord dari bagian <pre> atau div.entry-content
    let rawChord = $('pre').first().text();
    if (!rawChord || rawChord.trim() === '') {
      rawChord = $('div.entry-content pre').text() || $('div.entry-content').text();
    }

    if (!rawChord || rawChord.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Tidak dapat menemukan konten chord (tag <pre> kosong) pada halaman target.' }, 
        { status: 404 }
      );
    }

    const cleanedChord = rawChord
      .replace(/Autoscroll\s*Stop\s*Start/gi, '')
      .replace(/Transpose\s*:\s*\[.*?\]/gi, '')
      .trim();

    const finalTitle = title || "Tanpa Judul";
    const finalArtist = artist || "Unknown Artist";
    const finalChord = cleanedChord;
    const finalCover = "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&h=600&auto=format&fit=crop";

    // 1. Check if song already exists in 'songs' or 'chords'
    const { data: existingSong } = await supabase
      .from('songs')
      .select('id')
      .eq('title', finalTitle)
      .eq('artist', finalArtist)
      .maybeSingle();

    if (existingSong?.id) {
      await supabase
        .from('songs')
        .update({
          title: finalTitle,
          artist: finalArtist,
          chords: finalChord,
        })
        .eq('id', existingSong.id);
    } else {
      // Insert new row to 'songs' (using valid columns only)
      const { error: songsError } = await supabase
        .from('songs')
        .insert({
          title: finalTitle,
          artist: finalArtist,
          chords: finalChord,
          view_count: 0
        });

      if (songsError) {
        console.warn('[SUPABASE SONGS INSERT WARN/FALLBACK]:', songsError.message);
        // Fallback to 'chords' table if 'songs' schema varies
        await supabase
          .from('chords')
          .insert({
            title: finalTitle,
            artist: finalArtist,
            content: finalChord,
            source_url: targetUrl,
            cover_url: finalCover,
            views: 0
          });
      }
    }

    // Mengembalikan Respons Sukses Format Konsisten
    return NextResponse.json({
      success: true,
      title: finalTitle,
      artist: finalArtist,
      chord: finalChord,
      original_url: targetUrl
    });

  } catch (error: any) {
    console.error('[API SCRAPER ERROR]:', error?.message || error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Sistem gagal mengambil halaman. Pastikan koneksi internet stabil atau URL target dapat diakses.' 
      }, 
      { status: 500 }
    );
  }
}
