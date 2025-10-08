import { NextRequest, NextResponse } from 'next/server';
import { v5 as uuidv5 } from 'uuid';

// Configuration
const ELIZA_BASE_URL = process.env.ELIZA_API_URL || 'http://localhost:3000';
const KAIROS_AGENT_ID = process.env.KAIROS_AGENT_ID;

// Namespace for generating consistent UUIDs from FIDs
const FARCASTER_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

// Helper: Convert Farcaster FID to consistent UUID
function fidToUuid(fid: number): string {
  return uuidv5(`farcaster:${fid}`, FARCASTER_NAMESPACE);
}

// Helper: Get or create session for a Farcaster user
async function getOrCreateSession(fid: number): Promise<string | null> {
  const userId = fidToUuid(fid);

  try {
    const response = await fetch(`${ELIZA_BASE_URL}/api/messaging/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentId: KAIROS_AGENT_ID,
        userId: userId,
        metadata: {
          source: 'farcaster_miniapp',
          fid: fid.toString(),
          createdAt: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      console.error(`Failed to create session: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.sessionId || data.id;
  } catch (error) {
    console.error('Session creation error:', error);
    return null;
  }
}

// Helper: Send message to Kairos via Sessions API
async function sendParadoxToKairos(
  sessionId: string,
  paradoxText: string,
  fid: number
): Promise<boolean> {
  try {
    const response = await fetch(
      `${ELIZA_BASE_URL}/api/messaging/sessions/${sessionId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: paradoxText,
          metadata: {
            fid: fid.toString(),
            type: 'paradox',
            source: 'farcaster_miniapp',
            timestamp: new Date().toISOString()
          }
        })
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Message send error:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { paradox, fid, username } = await req.json();

    if (!paradox || !fid || !username) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (paradox.length < 10 || paradox.length > 500) {
      return NextResponse.json(
        { error: 'Paradox must be between 10 and 500 characters' },
        { status: 400 }
      );
    }

    // Send to ElizaOS if configured
    if (KAIROS_AGENT_ID) {
      const sessionId = await getOrCreateSession(fid);
      if (sessionId) {
        await sendParadoxToKairos(sessionId, paradox, fid);
      }
    }

    // Calculate confusion impact (simple heuristic for demo)
    const confusionAdded = Math.random() * 0.05 + 0.02; // 2-7% impact

    // Update leaderboard
    await fetch(`${req.nextUrl.origin}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fid, username, confusionAdded })
    });

    // Update user stats
    await fetch(`${req.nextUrl.origin}/api/stats/${fid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        confusionAdded,
        newConfusionLevel: 0.67 + confusionAdded // This should come from contract
      })
    });

    return NextResponse.json({
      success: true,
      confusionAdded,
      message: 'Paradox submitted successfully!'
    });
  } catch (error) {
    console.error('Paradox submission error:', error);
    return NextResponse.json(
      { error: 'Submission failed' },
      { status: 500 }
    );
  }
}
