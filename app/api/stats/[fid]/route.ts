import { NextRequest, NextResponse } from 'next/server';

// In-memory user stats (replace with database in production)
let userStatsData: Map<number, {
  paradoxesSubmitted: number;
  totalImpact: number;
  highestConfusion: number;
  currentStreak: number;
  lastSubmission: number;
  achievements: string[];
}> = new Map();

export async function GET(
  req: NextRequest,
  { params }: { params: { fid: string } }
) {
  try {
    const fid = parseInt(params.fid);

    if (isNaN(fid)) {
      return NextResponse.json({ error: 'Invalid FID' }, { status: 400 });
    }

    const stats = userStatsData.get(fid) || {
      paradoxesSubmitted: 0,
      totalImpact: 0,
      highestConfusion: 0,
      currentStreak: 0,
      lastSubmission: 0,
      achievements: []
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { fid: string } }
) {
  try {
    const fid = parseInt(params.fid);
    const { confusionAdded, newConfusionLevel } = await req.json();

    if (isNaN(fid)) {
      return NextResponse.json({ error: 'Invalid FID' }, { status: 400 });
    }

    // Get or create user stats
    const stats = userStatsData.get(fid) || {
      paradoxesSubmitted: 0,
      totalImpact: 0,
      highestConfusion: 0,
      currentStreak: 0,
      lastSubmission: 0,
      achievements: []
    };

    // Update stats
    stats.paradoxesSubmitted += 1;
    stats.totalImpact += confusionAdded || 0;
    if (newConfusionLevel > stats.highestConfusion) {
      stats.highestConfusion = newConfusionLevel;
    }

    // Check streak
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const twoDaysAgo = now - (48 * 60 * 60 * 1000);

    if (stats.lastSubmission >= oneDayAgo) {
      stats.currentStreak += 1;
    } else if (stats.lastSubmission < twoDaysAgo) {
      stats.currentStreak = 1; // Reset streak
    } else {
      stats.currentStreak = 1; // First submission or broken streak
    }

    stats.lastSubmission = now;

    // Check for achievements
    const newAchievements: string[] = [];

    if (stats.paradoxesSubmitted === 1 && !stats.achievements.includes('🎯')) {
      newAchievements.push('🎯'); // First paradox
    }
    if (stats.paradoxesSubmitted === 10 && !stats.achievements.includes('🏆')) {
      newAchievements.push('🏆'); // 10 paradoxes
    }
    if (stats.paradoxesSubmitted === 100 && !stats.achievements.includes('💎')) {
      newAchievements.push('💎'); // 100 paradoxes
    }
    if (stats.currentStreak === 7 && !stats.achievements.includes('🔥')) {
      newAchievements.push('🔥'); // 7-day streak
    }
    if (stats.highestConfusion >= 0.95 && !stats.achievements.includes('🚨')) {
      newAchievements.push('🚨'); // Caused emergency zone
    }

    stats.achievements = [...stats.achievements, ...newAchievements];

    userStatsData.set(fid, stats);

    return NextResponse.json({
      success: true,
      stats,
      newAchievements
    });
  } catch (error) {
    console.error('Stats update error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
