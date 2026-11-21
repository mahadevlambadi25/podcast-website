import { ImageResponse } from 'next/og';
import { siteConfig } from '@/config/site';

export const runtime = 'edge';

// Bundled from public/brand/unchartered-wordmark.png (the single brand wordmark asset)
const wordmarkData = fetch(
  new URL('../../../../public/brand/unchartered-wordmark.png', import.meta.url)
).then((res) => res.arrayBuffer());

function toDataUrl(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return `data:image/png;base64,${btoa(binary)}`;
}

export async function GET(request: Request) {
  try {
    const wordmarkDataUrl = toDataUrl(await wordmarkData);
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || siteConfig.brandName;
    const subtitle = searchParams.get('subtitle') || siteConfig.tagline;
    const type = searchParams.get('type') || 'EPISODE'; // GUEST or EPISODE

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#101C2C',
            backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(198, 161, 91, 0.15) 0%, rgba(16, 28, 44, 1) 70%)',
            padding: '60px 80px',
            fontFamily: 'serif',
            border: '12px solid #19283B',
            boxSizing: 'border-box',
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {/* Gold UNCHARTERED — LEGENDS & LEGACIES wordmark (6.25:1) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={wordmarkDataUrl} width={300} height={48} alt={siteConfig.brandName} />
            </div>

            <div
              style={{
                backgroundColor: 'rgba(201, 169, 97, 0.15)',
                border: '1px solid #C6A15B',
                color: '#C6A15B',
                padding: '6px 18px',
                borderRadius: '100px',
                fontSize: '14px',
                fontFamily: 'sans-serif',
                letterSpacing: '2px',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              {type}
            </div>
          </div>

          {/* Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                color: '#FFFFFF',
                fontSize: '52px',
                fontWeight: 800,
                lineHeight: 1.15,
                maxWidth: '1000px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </div>

            <div
              style={{
                color: '#94A3B8',
                fontSize: '24px',
                lineHeight: 1.4,
                maxWidth: '900px',
                fontFamily: 'sans-serif',
              }}
            >
              {subtitle}
            </div>
          </div>

          {/* Footer Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              paddingTop: '24px',
              fontFamily: 'sans-serif',
            }}
          >
            <span style={{ color: '#C6A15B', fontSize: '18px', fontWeight: 600 }}>
              Legends &amp; Legacies
            </span>
            <span style={{ color: '#64748B', fontSize: '16px' }}>
              {siteConfig.publisher.attribution}
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate image: ${e.message}`, { status: 500 });
  }
}
