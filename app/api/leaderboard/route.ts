import { NextRequest, NextResponse } from 'next/server';

// In-memory leaderboard (replace with database in production)
let leaderboardData: Map<number, {
  fid: number;
  username: string;
  paradoxCount: number;
  totalConfusion: number;
}> = new Map();

export async function GET(req: NextRequest) {
  try {
    // Convert to array and sort by total confusion
    const entries = Array.from(leaderboardData.values())
      .sort((a, b) => b.totalConfusion - a.totalConfusion)
      .slice(0, 100) // Top 100
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { fid, username, confusionAdded } = await req.json();

    if (!fid || !username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get or create user entry
    const existing = leaderboardData.get(fid) || {
      fid,
      username,
      paradoxCount: 0,
      totalConfusion: 0
    };

    // Update stats
    existing.paradoxCount += 1;
    existing.totalConfusion += confusionAdded || 0;
    existing.username = username; // Update username in case it changed

    leaderboardData.set(fid, existing);

    return NextResponse.json({ success: true, entry: existing });
  } catch (error) {
    console.error('Leaderboard update error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
