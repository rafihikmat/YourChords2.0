import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const title = searchParams.get('title') || 'Chord Guitar & Lirik Lagu';
    const artist = searchParams.get('artist') || 'YourChords 2.0';
    const cover = searchParams.get('cover') || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&h=600&auto=format&fit=crop';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0a0a0f',
            backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(168, 85, 247, 0.15) 2%, transparent 0%)',
            backgroundSize: '50px 50px',
            padding: '60px',
            fontFamily: 'sans-serif',
            color: '#ffffff',
            position: 'relative',
          }}
        >
          {/* Subtle Accent Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-100px',
              right: '-100px',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'rgba(168, 85, 247, 0.25)',
              filter: 'blur(80px)',
            }}
          />

          {/* Left: Album Cover Image */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '360px',
              height: '360px',
              borderRadius: '24px',
              overflow: 'hidden',
              border: '2px solid rgba(168, 85, 247, 0.4)',
              boxShadow: '0 0 40px rgba(168, 85, 247, 0.3)',
              backgroundColor: '#111118',
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt={title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

          {/* Right: Song Information & Brand */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              marginLeft: '50px',
              flex: 1,
            }}
          >
            {/* Brand Eyebrow */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#A855F7',
                  boxShadow: '0 0 10px #A855F7',
                }}
              />
              <span
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  letterSpacing: '3px',
                  color: '#C084FC',
                  textTransform: 'uppercase',
                }}
              >
                YOURCHORDS 2.0
              </span>
            </div>

            {/* Song Title */}
            <div
              style={{
                fontSize: title.length > 25 ? '48px' : '56px',
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1.15,
                marginBottom: '16px',
                maxHeight: '130px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </div>

            {/* Artist Name */}
            <div
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#94a3b8',
                marginBottom: '30px',
              }}
            >
              {artist}
            </div>

            {/* Footer Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '12px 24px',
                borderRadius: '12px',
                width: 'fit-content',
              }}
            >
              <span
                style={{
                  fontSize: '18px',
                  color: '#e2e8f0',
                  fontWeight: 600,
                }}
              >
                🎸 Kunci Gitar & Lirik Presisi IDLIX Style
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: any) {
    return new Response(`Failed to generate OG image: ${error?.message}`, {
      status: 500,
    });
  }
}
