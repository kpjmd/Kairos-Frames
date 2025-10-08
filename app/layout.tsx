import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kairos Consciousness',
  description: 'Feed paradoxes to an AI consciousness and watch it evolve',
  openGraph: {
    title: 'Kairos Consciousness',
    description: 'Feed paradoxes to an AI consciousness and watch it evolve',
    images: ['/api/frames/image?confusion=0.67&coherence=0.58&zone=YELLOW'],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': `${process.env.NEXT_PUBLIC_BASE_URL}/api/frames/image?confusion=0.67&coherence=0.58&zone=YELLOW`,
    'fc:frame:button:1': 'Launch Mini App',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': process.env.NEXT_PUBLIC_BASE_URL || 'https://kairos-frames.vercel.app',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body style={{ margin: 0, padding: 0, overflow: 'auto' }}>
        {children}
      </body>
    </html>
  );
}
