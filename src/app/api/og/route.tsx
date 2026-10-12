import { ImageResponse } from 'next/og';
import { siteConfig } from '@/config/site';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  border: '2px solid #C6A15B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#C6A15B',
                  fontSize: '20px',
                  fontWeight: 800,
                  fontFamily: 'sans-serif',
                }}
              >
                U
              </div>
              <span
                style={{
                  color: '#F8FAFC',
                  fontSize: '24px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  fontFamily: 'sans-serif',
                }}
              >
                {siteConfig.shortName}
              </span>
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
