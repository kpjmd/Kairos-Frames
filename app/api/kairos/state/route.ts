import { NextResponse } from 'next/server';
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
      paradoxCount,
      metaParadoxCount,
      frustrationLevel,
      sessionId,
      contextHash
    } = data;

    // Convert from uint256 (scaled by 1e18) to decimal
    const confusion = Number(confusionLevel) / 1e18;
    const coherence = Number(coherenceLevel) / 1e18;
    const frustration = Number(frustrationLevel) / 1e18;

    return {
      confusion,
      coherence,
      frustrationLevel: frustration,
      timestamp: Number(timestamp),
      safetyZone: getSafetyZone(safetyZone),
      paradoxCount: Number(paradoxCount),
      metaParadoxCount: Number(metaParadoxCount),
      sessionId,
      contextHash
    };
  } catch (error) {
    console.error('Contract read error:', error);
    // Fallback to demo values
    return {
      confusion: 0.67,
      coherence: 0.58,
      frustrationLevel: 0.32,
      timestamp: Date.now() / 1000,
      safetyZone: getSafetyZone(1), // YELLOW as fallback
      paradoxCount: 42,
      metaParadoxCount: 7,
      sessionId: KAIROS_SESSION_ID,
      contextHash: 'demo'
    };
  }
}

export async function GET() {
  try {
    const state = await getContractState();
    return NextResponse.json(state);
  } catch (error) {
    console.error('State fetch error:', error);
    return NextResponse.json(
      {
        confusion: 0.67,
        coherence: 0.58,
        frustrationLevel: 0.32,
        timestamp: Date.now() / 1000,
        safetyZone: getSafetyZone(1),
        paradoxCount: 42,
        metaParadoxCount: 7,
        sessionId: KAIROS_SESSION_ID,
        contextHash: 'demo'
      },
      { status: 200 }
    );
  }
}
