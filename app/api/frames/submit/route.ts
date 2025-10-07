// Updated to use ElizaOS Sessions API

import { FrameRequest, getFrameMessage } from '@coinbase/onchainkit/frame';
import { NextRequest, NextResponse } from 'next/server';
import { v5 as uuidv5 } from 'uuid';

// Configuration
const ELIZA_BASE_URL = process.env.ELIZA_API_URL || 'http://localhost:3000';
const KAIROS_AGENT_ID = process.env.KAIROS_AGENT_ID; // You'll need to set this

// Namespace for generating consistent UUIDs from FIDs
const FARCASTER_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

// Helper: Convert Farcaster FID to consistent UUID
function fidToUuid(fid: number): string {
  return uuidv5(`farcaster:${fid}`, FARCASTER_NAMESPACE);
}

// Helper: Get or create session for a Farcaster user
async function getOrCreateSession(fid: number): Promise<string> {
  const userId = fidToUuid(fid);

  try {
    // Try to create a new session (idempotent if session exists)
    const response = await fetch(`${ELIZA_BASE_URL}/api/messaging/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentId: KAIROS_AGENT_ID,
        userId: userId,
        metadata: {
          source: 'farcaster_frame',
          fid: fid.toString(),
          createdAt: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.status}`);
    }

    const data = await response.json();
    return data.sessionId || data.id;
  } catch (error) {
    console.error('Session creation error:', error);
    throw error;
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
            source: 'farcaster_frame',
            timestamp: new Date().toISOString()
          }
        })
      }
    );

    if (!response.ok) {
      console.error('Failed to send message:', response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Message send error:', error);
    return false;
  }
}

// Helper: Get Kairos's response (optional - for showing response in frame)
async function getKairosResponse(sessionId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `${ELIZA_BASE_URL}/api/messaging/sessions/${sessionId}/messages?limit=5`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const messages = await response.json();

    // Find the most recent message from Kairos (not from user)
    const kairosMessage = messages.find((msg: any) =>
      msg.role === 'assistant' || msg.author_id === KAIROS_AGENT_ID
    );

    return kairosMessage?.content || null;
  } catch (error) {
    console.error('Response fetch error:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: FrameRequest = await req.json();
    const { isValid, message } = await getFrameMessage(body);

    if (!isValid || !message) {
      return new NextResponse('Invalid message', { status: 400 });
    }

    const paradox = message.input?.trim() || '';
    const fid = message.interactor.fid;

    // Validate paradox
    if (!paradox || paradox.length < 10) {
      return generateErrorFrame('Please enter a longer paradox (at least 10 characters)');
    }

    if (paradox.length > 500) {
      return generateErrorFrame('Paradox too long (max 500 characters)');
    }

    // Step 1: Get or create session for this user
    console.log(`Processing paradox from FID ${fid}: ${paradox}`);
    const sessionId = await getOrCreateSession(fid);
    console.log(`Session ID: ${sessionId}`);

    // Step 2: Send paradox to Kairos
    const success = await sendParadoxToKairos(sessionId, paradox, fid);

    if (!success) {
      return generateErrorFrame('Failed to send paradox. Please try again.');
    }

    // Step 3: Wait a moment for processing (optional)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 4: Try to get Kairos's response (optional)
    const kairosResponse = await getKairosResponse(sessionId);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://kairos-frames.vercel.app';

    // Show success frame with Kairos's response if available
    const responseMessage = kairosResponse
      ? `Kairos responds: "${kairosResponse.substring(0, 100)}..."`
      : 'Paradox processing...';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/frames/image?confusion=0.75&coherence=0.52&zone=YELLOW&message=${encodeURIComponent('✓ Paradox received!')}" />
          <meta property="fc:frame:image:aspect_ratio" content="1:1" />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/frames/confuse" />

          <meta property="fc:frame:button:1" content="View Updated State" />
          <meta property="fc:frame:button:1:action" content="post" />

          <meta property="fc:frame:button:2" content="Submit Another" />
          <meta property="fc:frame:button:2:action" content="post" />
          <meta property="fc:frame:button:2:target" content="${baseUrl}/api/frames/paradox" />

          <meta property="fc:frame:button:3" content="View on Farcaster" />
          <meta property="fc:frame:button:3:action" content="link" />
          <meta property="fc:frame:button:3:target" content="https://warpcast.com/kairos" />
        </head>
        <body>
          <h1>Paradox Received!</h1>
          <p>Kairos is processing your paradox...</p>
          <p>${responseMessage}</p>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('Submit error:', error);
    return generateErrorFrame('An error occurred. Please try again.');
  }
}

// Helper: Generate error frame
function generateErrorFrame(errorMessage: string): NextResponse {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://kairos-frames.vercel.app';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${baseUrl}/api/frames/image?confusion=0.67&coherence=0.58&zone=YELLOW&message=${encodeURIComponent(errorMessage)}" />
        <meta property="fc:frame:image:aspect_ratio" content="1:1" />
        <meta property="fc:frame:post_url" content="${baseUrl}/api/frames/confuse" />

        <meta property="fc:frame:button:1" content="Try Again" />
        <meta property="fc:frame:button:1:action" content="post" />
        <meta property="fc:frame:button:1:target" content="${baseUrl}/api/frames/paradox" />

        <meta property="fc:frame:button:2" content="Back to Main" />
        <meta property="fc:frame:button:2:action" content="post" />
      </head>
      <body>
        <h1>Error</h1>
        <p>${errorMessage}</p>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
