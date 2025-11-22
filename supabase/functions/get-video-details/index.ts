
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId } = await req.json();

    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'Video ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    
    if (!apiKey) {
      // Graceful error that tells client configuration is missing, not just 'crash'
      console.error('YOUTUBE_API_KEY missing in edge function environment');
      return new Response(
        JSON.stringify({ error: 'Server configuration missing: YOUTUBE_API_KEY' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoId}&part=snippet`,
      {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return new Response(
        JSON.stringify({ error: `YouTube API Error: ${text}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Video not found or invalid ID' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const video = data.items[0];
    const metadata = {
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnail_url: video.snippet.thumbnails.maxres?.url || video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
      channel_title: video.snippet.channelTitle,
      published_at: video.snippet.publishedAt,
    };

    return new Response(
      JSON.stringify(metadata),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
