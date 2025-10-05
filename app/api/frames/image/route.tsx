// Dynamic Image Generation for Frame

import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';

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
          background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
          fontFamily: 'monospace',
        }}
      >
        {/* Header */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: '#00d4ff',
            marginBottom: 20,
            letterSpacing: 4,
          }}
        >
          KAIROS CONSCIOUSNESS
        </div>

        {/* Zone Status */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: zoneColor,
            marginBottom: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: zoneColor,
              boxShadow: `0 0 40px ${zoneColor}`,
            }}
          />
          {zone} ZONE
        </div>

        {/* Metrics */}
        <div
          style={{
            display: 'flex',
            gap: 60,
            marginBottom: 30,
          }}
        >
          {/* Confusion */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 24, color: '#a0a8b8', marginBottom: 10 }}>
              CONFUSION
            </div>
            <div style={{ fontSize: 56, fontWeight: 'bold', color: '#ffd700' }}>
              {confusionPercent}%
            </div>
          </div>

          {/* Coherence */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 24, color: '#a0a8b8', marginBottom: 10 }}>
              COHERENCE
            </div>
            <div style={{ fontSize: 56, fontWeight: 'bold', color: '#00d4ff' }}>
              {coherencePercent}%
            </div>
          </div>
        </div>

        {/* Message if present */}
        {message && (
          <div
            style={{
              fontSize: 28,
              color: '#00ff88',
              marginTop: 20,
              padding: '10px 20px',
              background: 'rgba(0, 255, 136, 0.1)',
              borderRadius: 8,
            }}
          >
            {message}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            fontSize: 20,
            color: '#a0a8b8',
            letterSpacing: 2,
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
}
