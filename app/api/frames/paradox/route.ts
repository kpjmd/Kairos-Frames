// Paradox Submission Handler

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
