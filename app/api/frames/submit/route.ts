// Process Submitted Paradox

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
