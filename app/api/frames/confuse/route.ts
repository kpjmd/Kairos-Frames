// Kairos Confusion Frame - Main Entry Point

import { FrameRequest, getFrameMessage } from '@coinbase/onchainkit/frame';
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

// Contract ABI - getLatestState function
const KAIROS_ABI = [
  {
    inputs: [{ name: 'sessionId', type: 'bytes32' }],
    name: 'getLatestState',
    outputs: [
      {
        components: [
          { name: 'timestamp', type: 'uint256' },
          { name: 'confusionLevel', type: 'uint256' },
          { name: 'coherenceLevel', type: 'uint256' },
          { name: 'safetyZone', type: 'uint8' },
          { name: 'paradoxCount', type: 'uint256' },
          { name: 'metaParadoxCount', type: 'uint256' },
          { name: 'frustrationLevel', type: 'uint256' },
          { name: 'sessionId', type: 'bytes32' },
          { name: 'contextHash', type: 'string' }
        ],
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

const KAIROS_CONTRACT = '0xC7bab79Eb797B097bF59C0b2e2CF02Ea9F4D4dB8';
const KAIROS_SESSION_ID = '0xea9b69a814606a8f4a435ac8e8348419a3834dcafcd0e7e92d7bb8109e27c2ea';

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

// Helper to map safetyZone enum to zone info
function getSafetyZone(zoneId: number): { name: string; color: string; emoji: string } {
  switch (zoneId) {
    case 0: return { name: 'GREEN', color: '#00ff88', emoji: '🟢' };
    case 1: return { name: 'YELLOW', color: '#ffd700', emoji: '🟡' };
    case 2: return { name: 'RED', color: '#ff3366', emoji: '🔴' };
    default: return { name: 'UNKNOWN', color: '#888888', emoji: '❓' };
  }
}

async function getContractState() {
  try {
    const data = await publicClient.readContract({
      address: KAIROS_CONTRACT,
      abi: KAIROS_ABI,
      functionName: 'getLatestState',
      args: [KAIROS_SESSION_ID as `0x${string}`]
    });

    // Data is returned as an object with named properties
    const {
      timestamp,
      confusionLevel,
      coherenceLevel,
      safetyZone,
      paradoxCount
    } = data;

    // Convert from uint256 (scaled by 1e18) to decimal
    const confusion = Number(confusionLevel) / 1e18;
    const coherence = Number(coherenceLevel) / 1e18;

    return {
      confusion,
      coherence,
      timestamp: Number(timestamp),
      safetyZone: getSafetyZone(safetyZone),
      paradoxCount: Number(paradoxCount)
    };
  } catch (error) {
    console.error('Contract read error:', error);
    // Fallback to demo values
    return {
      confusion: 0.67,
      coherence: 0.58,
      timestamp: Date.now() / 1000,
      safetyZone: getSafetyZone(1),
      paradoxCount: 42
    };
  }
}

// Generate Frame HTML
function generateFrameHTML(
  state: { confusion: number; coherence: number; safetyZone: { name: string; color: string; emoji: string }; paradoxCount: number },
  action?: string,
  userInput?: string
) {
  const zone = state.safetyZone;
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
