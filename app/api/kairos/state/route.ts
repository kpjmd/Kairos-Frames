import { NextResponse } from 'next/server';
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
    return {
      confusion: 0.67,
      coherence: 0.58,
      metaAwareness: 0.45,
      timestamp: Date.now() / 1000
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
        metaAwareness: 0.45,
        timestamp: Date.now() / 1000
      },
      { status: 200 }
    );
  }
}
