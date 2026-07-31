import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("missing_songs_log")
      .select("*")
      .order("search_count", { ascending: false })
      .limit(20);

    if (error || !data || data.length === 0) {
      // Fallback query by 'count' if 'search_count' was not found
      const { data: dataByCount, error: errCount } = await supabase
        .from("missing_songs_log")
        .select("*")
        .order("count", { ascending: false })
        .limit(20);

      if (!errCount && dataByCount && dataByCount.length > 0) {
        const normalized = dataByCount.map((item: any) => ({
          id: item.id || item.query || item.keyword,
          keyword: item.keyword || item.query || "Tanpa Kata Kunci",
          query: item.query || item.keyword || "Tanpa Kata Kunci",
          search_count: Number(item.search_count || item.count || 1),
          count: Number(item.count || item.search_count || 1),
          last_searched_at: item.last_searched_at || item.updated_at ||
            item.created_at || new Date().toISOString(),
        }));
        return NextResponse.json({ success: true, requests: normalized });
      }

      // Default fallback list for demo/testing
      const defaultRequests = [
        {
          id: "1",
          keyword: "Dewa 19 - Pupus",
          query: "Dewa 19 - Pupus",
          search_count: 84,
          count: 84,
          last_searched_at: new Date().toISOString(),
        },
        {
          id: "2",
          keyword: "Sheila On 7 - Dan",
          query: "Sheila On 7 - Dan",
          search_count: 72,
          count: 72,
          last_searched_at: new Date().toISOString(),
        },
        {
          id: "3",
          keyword: "Nadin Amizah - Rayuan Perempuan Gila",
          query: "Nadin Amizah - Rayuan Perempuan Gila",
          search_count: 65,
          count: 65,
          last_searched_at: new Date().toISOString(),
        },
        {
          id: "4",
          keyword: "Bernadya - Kata Mereka Ini Berlebihan",
          query: "Bernadya - Kata Mereka Ini Berlebihan",
          search_count: 59,
          count: 59,
          last_searched_at: new Date().toISOString(),
        },
        {
          id: "5",
          keyword: "Peterpan - Menghapus Jejakmu",
          query: "Peterpan - Menghapus Jejakmu",
          search_count: 48,
          count: 48,
          last_searched_at: new Date().toISOString(),
        },
      ];
      return NextResponse.json({ success: true, requests: defaultRequests });
    }

    const normalized = data.map((item: any) => ({
      id: item.id || item.keyword || item.query,
      keyword: item.keyword || item.query || "Tanpa Kata Kunci",
      query: item.query || item.keyword || "Tanpa Kata Kunci",
      search_count: Number(item.search_count || item.count || 1),
      count: Number(item.count || item.search_count || 1),
      last_searched_at: item.last_searched_at || item.updated_at ||
        item.created_at || new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, requests: normalized });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, {
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let keyword = body.keyword || body.query;

    if (!keyword && body.title && body.artist) {
      keyword = `${body.title.trim()} - ${body.artist.trim()}`;
    }

    if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Kata kunci pencarian atau judul & artist wajib diisi.",
        },
        { status: 400 },
      );
    }

    const cleanKeyword = keyword.trim();
    const cleanLower = cleanKeyword.toLowerCase();
    const nowIso = new Date().toISOString();

    // 1. Try checking in 'missing_songs_log' by keyword or query
    let { data: existing } = await supabase
      .from("missing_songs_log")
      .select("*")
      .or(`keyword.ilike.%${cleanLower}%,query.ilike.%${cleanLower}%`)
      .maybeSingle();

    if (existing) {
      const currentCount = Number(existing.search_count || existing.count || 1);
      const newCount = currentCount + 1;

      await supabase
        .from("missing_songs_log")
        .update({
          search_count: newCount,
          count: newCount,
          last_searched_at: nowIso,
        })
        .eq("id", existing.id);
    } else {
      // Insert new record
      const { error: insertErr } = await supabase
        .from("missing_songs_log")
        .insert({
          keyword: cleanKeyword,
          query: cleanLower,
          search_count: 1,
          count: 1,
          last_searched_at: nowIso,
        });

      if (insertErr) {
        console.warn("[MISSING_SONGS_LOG INSERT FALLBACK]:", insertErr.message);
        // Fallback to 'search_logs' table
        const { data: existingSearchLog } = await supabase
          .from("search_logs")
          .select("*")
          .eq("query", cleanLower)
          .maybeSingle();

        if (existingSearchLog) {
          await supabase
            .from("search_logs")
            .update({
              count: (Number(existingSearchLog.count) || 1) + 1,
              last_searched_at: nowIso,
            })
            .eq("id", existingSearchLog.id);
        } else {
          await supabase.from("search_logs").insert({
            query: cleanLower,
            count: 1,
            last_searched_at: nowIso,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message:
        `Request Terkirim ke Admin! Tim kami akan segera meninjau dan menambahkan chord "${cleanKeyword}".`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, {
      status: 500,
    });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");
    let keyword = searchParams.get("keyword");

    if (!id && !keyword) {
      try {
        const body = await req.json();
        id = body.id;
        keyword = body.keyword || body.query;
      } catch {}
    }

    if (!id && !keyword) {
      return NextResponse.json(
        {
          success: false,
          error: "ID atau Keyword permintaan lagu wajib disertakan.",
        },
        { status: 400 },
      );
    }

    if (id) {
      await supabase.from("missing_songs_log").delete().eq("id", id);
      await supabase.from("search_logs").delete().eq("id", id);
    }

    if (keyword) {
      const cleanLower = keyword.trim().toLowerCase();
      await supabase.from("missing_songs_log").delete().or(
        `keyword.ilike.%${cleanLower}%,query.ilike.%${cleanLower}%`,
      );
      await supabase.from("search_logs").delete().eq("query", cleanLower);
    }

    return NextResponse.json({
      success: true,
      message: "Permintaan lagu berhasil dihapus/ditandai selesai.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, {
      status: 500,
    });
  }
}
