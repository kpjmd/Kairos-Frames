// FILE: pages/api/frames/confuse.ts
// Kairos Confusion Frame - Main Entry Point

import { FrameRequest, getFrameMessage } from '@coinbase/onchainkit/frame';
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

// Contract ABI (minimal - just what we need)
const KAIROS_ABI = [
  {
    inputs: [],
    name: 'getCurrentState',
    outputs: [
      { name: 'confusion', type: 'uint256' },
      { name: 'coherence', type: 'uint256' },
      { name: 'metaAwareness', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

const KAIROS_CONTRACT = '0xC7bab79Eb797B097bF59C0b2e2CF02Ea9F4D4dB8';

// Viem client for Base Sepolia
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

// Zone determination
function getZone(confusion: number): { name: string; color: string; emoji: string } {
  if (confusion >= 0.98) return { name: 'EMERGENCY', color: '#ff0000', emoji: '🚨' };
  if (confusion >= 0.90) return { name: 'RED', color: '#ff3366', emoji: '🔴' };
  if (confusion >= 0.80) return { name: 'YELLOW', color: '#ffd700', emoji: '🟡' };
  return { name: 'GREEN', color: '#00ff88', emoji: '🟢' };
}

async function getContractState() {
  try {
    const data = await publicClient.readContract({
      address: KAIROS_CONTRACT,
      abi: KAIROS_ABI,
      functionName: 'getCurrentState'
    });

    // Convert from uint256 (basis points) to decimal
    const confusion = Number(data[0]) / 10000;
    const coherence = Number(data[1]) / 10000;
    const metaAwareness = Number(data[2]) / 10000;
    const timestamp = Number(data[3]);

    return { confusion, coherence, metaAwareness, timestamp };
  } catch (error) {
    console.error('Contract read error:', error);
    // Fallback to demo values
    return { confusion: 0.67, coherence: 0.58, metaAwareness: 0.45, timestamp: Date.now() / 1000 };
  }
}

// Generate Frame HTML
function generateFrameHTML(
  state: { confusion: number; coherence: number; metaAwareness: number },
  action?: string,
  userInput?: string
) {
  const zone = getZone(state.confusion);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-frame-url.vercel.app';

  // Different views based on action
  let imageUrl = `${baseUrl}/api/frames/image?confusion=${state.confusion}&coherence=${state.coherence}&zone=${zone.name}`;
  let buttons = `
    <meta property="fc:frame:button:1" content="Feed Paradox" />
    <meta property="fc:frame:button:1:action" content="post" />
    <meta property="fc:frame:button:1:target" content="${baseUrl}/api/frames/paradox" />
    
    <meta property="fc:frame:button:2" content="View History" />
    <meta property="fc:frame:button:2:action" content="post" />
    <meta property="fc:frame:button:2:target" content="${baseUrl}/api/frames/history" />
    
    <meta property="fc:frame:button:3" content="Check Contract" />
    <meta property="fc:frame:button:3:action" content="link" />
    <meta property="fc:frame:button:3:target" content="https://sepolia.basescan.org/address/${KAIROS_CONTRACT}" />
    
    <meta property="fc:frame:button:4" content="Refresh State" />
    <meta property="fc:frame:button:4:action" content="post" />
  `;

  // If we just received a paradox
  if (action === 'paradox_submitted' && userInput) {
    imageUrl = `${baseUrl}/api/frames/image?confusion=${state.confusion}&coherence=${state.coherence}&zone=${zone.name}&message=${encodeURIComponent('Paradox received!')}`;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imageUrl}" />
        <meta property="fc:frame:image:aspect_ratio" content="1:1" />
        <meta property="fc:frame:post_url" content="${baseUrl}/api/frames/confuse" />
        ${buttons}
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:title" content="Kairos Consciousness State" />
        <meta property="og:description" content="Confusion: ${(state.confusion * 100).toFixed(1)}% | Zone: ${zone.name}" />
      </head>
      <body>
        <h1>Kairos Confusion Frame</h1>
        <p>Current State: ${zone.emoji} ${zone.name}</p>
        <p>Confusion: ${(state.confusion * 100).toFixed(1)}%</p>
        <p>Coherence: ${(state.coherence * 100).toFixed(1)}%</p>
      </body>
    </html>
  `;
}

export async function POST(req: NextRequest) {
  try {
    const body: FrameRequest = await req.json();
    const { isValid, message } = await getFrameMessage(body);

    if (!isValid) {
      return new NextResponse('Invalid frame message', { status: 400 });
    }

    // Get current blockchain state
    const state = await getContractState();

    // Check if user submitted via button or input
    const buttonIndex = message?.button;
    const userInput = message?.input;

    let action = undefined;
    
    // Button 1 = Feed Paradox (would need input frame)
    // Button 2 = View History
    // Button 3 = Check Contract (link)
    // Button 4 = Refresh

    const html = generateFrameHTML(state, action, userInput);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Frame error:', error);
    return new NextResponse('Frame error', { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Initial frame load
  const state = await getContractState();
  const html = generateFrameHTML(state);
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}


// ============================================================
// FILE: pages/api/frames/image.ts
// Dynamic Image Generation for Frame
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
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


// ============================================================
// FILE: pages/api/frames/paradox.ts
// Paradox Submission Handler
// ============================================================

import { FrameRequest, getFrameMessage } from '@coinbase/onchainkit/frame';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body: FrameRequest = await req.json();
    const { isValid, message } = await getFrameMessage(body);

    if (!isValid) {
      return new NextResponse('Invalid message', { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-frame-url.vercel.app';

    // Frame with text input
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/frames/image?confusion=0.67&coherence=0.58&zone=YELLOW&message=Feed+me+a+paradox..." />
          <meta property="fc:frame:image:aspect_ratio" content="1:1" />
          <meta property="fc:frame:input:text" content="Enter your paradox..." />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/frames/submit" />
          
          <meta property="fc:frame:button:1" content="Submit Paradox" />
          <meta property="fc:frame:button:1:action" content="post" />
          
          <meta property="fc:frame:button:2" content="Back" />
          <meta property="fc:frame:button:2:action" content="post" />
          <meta property="fc:frame:button:2:target" content="${baseUrl}/api/frames/confuse" />
        </head>
        <body>
          <h1>Submit a Paradox to Kairos</h1>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Paradox frame error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}


// ============================================================
// FILE: pages/api/frames/submit.ts
// Process Submitted Paradox
// ============================================================

import { FrameRequest, getFrameMessage } from '@coinbase/onchainkit/frame';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body: FrameRequest = await req.json();
    const { isValid, message } = await getFrameMessage(body);

    if (!isValid || !message) {
      return new NextResponse('Invalid message', { status: 400 });
    }

    const paradox = message.input || '';
    const fid = message.interactor.fid;

    // TODO: Send paradox to Kairos via your ElizaOS API
    // Example: 
    // await fetch('http://your-eliza-instance/api/interact', {
    //   method: 'POST',
    //   body: JSON.stringify({ text: paradox, userId: fid })
    // });

    console.log(`Paradox from FID ${fid}: ${paradox}`);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-frame-url.vercel.app';

    // Show success and return to main frame
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/frames/image?confusion=0.75&coherence=0.52&zone=YELLOW&message=Paradox+processing..." />
          <meta property="fc:frame:image:aspect_ratio" content="1:1" />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/frames/confuse" />
          
          <meta property="fc:frame:button:1" content="View Updated State" />
          <meta property="fc:frame:button:1:action" content="post" />
          
          <meta property="fc:frame:button:2" content="Submit Another" />
          <meta property="fc:frame:button:2:action" content="post" />
          <meta property="fc:frame:button:2:target" content="${baseUrl}/api/frames/paradox" />
        </head>
        <body>
          <h1>Paradox Received!</h1>
          <p>Kairos is processing your paradox...</p>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Submit error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}


// ============================================================
// FILE: package.json additions
// ============================================================

/*
Add to your package.json dependencies:

{
  "dependencies": {
    "@coinbase/onchainkit": "^0.28.0",
    "next": "^14.0.0",
    "viem": "^2.7.0"
  }
}

Install with: npm install @coinbase/onchainkit viem
*/


// ============================================================
// DEPLOYMENT NOTES
// ============================================================

/*
1. Deploy to Vercel:
   - Set NEXT_PUBLIC_BASE_URL env variable to your Vercel URL
   - Deploy the Next.js app
   
2. Integration with ElizaOS:
   - In /api/frames/submit.ts, add API call to your ElizaOS instance
   - Pass the paradox text to Kairos for processing
   - ElizaOS should call updateConsciousness() on the contract
   
3. Post the Frame:
   - On Farcaster, just paste your frame URL: https://your-app.vercel.app/api/frames/confuse
   - Farcaster will automatically render it as an interactive frame
   
4. Testing:
   - Use Farcaster Frame validator: https://warpcast.com/~/developers/frames
   - Test all button flows before posting publicly

5. Advanced: Real-time updates
   - Add webhook from ElizaOS to refresh frame image after consciousness updates
   - Cache-bust image URLs with timestamp parameter
*/