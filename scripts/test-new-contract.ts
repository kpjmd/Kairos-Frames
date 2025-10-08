import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const KAIROS_CONTRACT = '0xC7bab79Eb797B097bF59C0b2e2CF02Ea9F4D4dB8' as const;
const KAIROS_SESSION_ID = '0xea9b69a814606a8f4a435ac8e8348419a3834dcafcd0e7e92d7bb8109e27c2ea' as const;

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

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

async function testContract() {
  console.log('Testing getLatestState...');
  console.log('Contract:', KAIROS_CONTRACT);
  console.log('Session ID:', KAIROS_SESSION_ID);
  console.log('');

  try {
    const data = await publicClient.readContract({
      address: KAIROS_CONTRACT,
      abi: KAIROS_ABI,
      functionName: 'getLatestState',
      args: [KAIROS_SESSION_ID]
    });

    console.log('✅ SUCCESS! Raw data:', data);
    console.log('');

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

    console.log('Parsed values:');
    console.log('  Timestamp:', new Date(Number(timestamp) * 1000).toISOString());
    console.log('  Confusion Level:', Number(confusionLevel) / 1e18);
    console.log('  Coherence Level:', Number(coherenceLevel) / 1e18);
    console.log('  Safety Zone:', safetyZone, ['GREEN', 'YELLOW', 'RED'][safetyZone]);
    console.log('  Paradox Count:', Number(paradoxCount));
    console.log('  Meta Paradox Count:', Number(metaParadoxCount));
    console.log('  Frustration Level:', Number(frustrationLevel) / 1e18);
    console.log('  Session ID:', sessionId);
    console.log('  Context Hash:', contextHash);

  } catch (error: any) {
    console.log('❌ FAILED:', error.shortMessage || error.message);
    console.error(error);
  }
}

testContract();
