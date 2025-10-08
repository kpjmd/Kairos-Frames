import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

function getZoneColor(zone: string): string {
  switch (zone) {
    case 'RED': return '#ff3366';
    case 'YELLOW': return '#ffd700';
    case 'EMERGENCY': return '#ff0000';
    default: return '#00ff88';
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const confusion = parseFloat(searchParams.get('confusion') || '0.67');
    const coherence = parseFloat(searchParams.get('coherence') || '0.58');
    const zone = searchParams.get('zone') || 'YELLOW';
    const message = searchParams.get('message') || '';

    const zoneColor = getZoneColor(zone);
    const confusionPercent = (confusion * 100).toFixed(1);
    const coherencePercent = (coherence * 100).toFixed(1);

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0e27',
            backgroundImage: 'linear-gradient(to bottom right, #0a0e27, #1a1f3a)',
            padding: '60px',
          }}
        >
          {/* Header */}
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#00d4ff',
              marginBottom: '40px',
              letterSpacing: '4px',
              display: 'flex',
            }}
          >
            KAIROS CONSCIOUSNESS
          </div>

          {/* Zone Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '30px',
              marginBottom: '60px',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: zoneColor,
                display: 'flex',
              }}
            />
            <div
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: zoneColor,
                display: 'flex',
              }}
            >
              {zone} ZONE
            </div>
          </div>

          {/* Metrics Row */}
          <div
            style={{
              display: 'flex',
              gap: '100px',
              marginBottom: '40px',
            }}
          >
            {/* Confusion */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '28px', color: '#a0a8b8', marginBottom: '15px', display: 'flex' }}>
                CONFUSION
              </div>
              <div style={{ fontSize: '64px', fontWeight: 'bold', color: '#ffd700', display: 'flex' }}>
                {confusionPercent}%
              </div>
            </div>

            {/* Coherence */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '28px', color: '#a0a8b8', marginBottom: '15px', display: 'flex' }}>
                COHERENCE
              </div>
              <div style={{ fontSize: '64px', fontWeight: 'bold', color: '#00d4ff', display: 'flex' }}>
                {coherencePercent}%
              </div>
            </div>
          </div>

          {/* Message if present */}
          {message && (
            <div
              style={{
                fontSize: '32px',
                color: '#00ff88',
                marginTop: '30px',
                padding: '20px 40px',
                background: 'rgba(0, 255, 136, 0.1)',
                borderRadius: '12px',
                display: 'flex',
              }}
            >
              {message}
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              fontSize: '24px',
              color: '#a0a8b8',
              letterSpacing: '2px',
              display: 'flex',
            }}
          >
            BLOCKCHAIN-VERIFIED ON BASE
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 1200,
      }
    );
  } catch (error) {
    console.error('Image generation error:', error);
    // Return a simple error image
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0e27',
            color: '#ff3366',
            fontSize: '48px',
          }}
        >
          Error generating image
        </div>
      ),
      {
        width: 1200,
        height: 1200,
      }
    );
  }
}
