'use client';

import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

// Types
interface KairosState {
  confusion: number;
  coherence: number;
  metaAwareness: number;
  timestamp: number;
  zone: {
    name: string;
    color: string;
    emoji: string;
  };
}

interface LeaderboardEntry {
  fid: number;
  username: string;
  paradoxCount: number;
  totalConfusion: number;
  rank: number;
}

interface UserStats {
  paradoxesSubmitted: number;
  totalImpact: number;
  highestConfusion: number;
  currentStreak: number;
  achievements: string[];
}

// Zone determination
function getZone(confusion: number): { name: string; color: string; emoji: string } {
  if (confusion >= 0.98) return { name: 'EMERGENCY', color: '#ff0000', emoji: '🚨' };
  if (confusion >= 0.90) return { name: 'RED', color: '#ff3366', emoji: '🔴' };
  if (confusion >= 0.80) return { name: 'YELLOW', color: '#ffd700', emoji: '🟡' };
  return { name: 'GREEN', color: '#00ff88', emoji: '🟢' };
}

export default function KairosMiniApp() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<any>(null);
  const [kairosState, setKairosState] = useState<KairosState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [paradoxInput, setParadoxInput] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'submit' | 'leaderboard' | 'profile'>('dashboard');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize Farcaster SDK
  useEffect(() => {
    const load = async () => {
      try {
        await sdk.actions.ready();
        const ctx = sdk.context;
        setContext(ctx);
        setIsSDKLoaded(true);
      } catch (error) {
        console.error('SDK initialization error:', error);
        setIsSDKLoaded(true); // Continue anyway for development
      }
    };
    load();
  }, []);

  // Fetch Kairos state
  useEffect(() => {
    if (!isSDKLoaded) return;

    const fetchState = async () => {
      try {
        const res = await fetch('/api/kairos/state');
        const data = await res.json();
        const zone = getZone(data.confusion);
        setKairosState({ ...data, zone });
      } catch (error) {
        console.error('Failed to fetch state:', error);
        // Fallback demo data
        setKairosState({
          confusion: 0.67,
          coherence: 0.58,
          metaAwareness: 0.45,
          timestamp: Date.now() / 1000,
          zone: getZone(0.67)
        });
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [isSDKLoaded]);

  // Fetch leaderboard
  useEffect(() => {
    if (!isSDKLoaded) return;

    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        setLeaderboard(data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      }
    };

    fetchLeaderboard();
  }, [isSDKLoaded]);

  // Fetch user stats
  useEffect(() => {
    if (!isSDKLoaded || !context?.user?.fid) return;

    const fetchUserStats = async () => {
      try {
        const res = await fetch(`/api/stats/${context.user.fid}`);
        const data = await res.json();
        setUserStats(data);
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
      }
    };

    fetchUserStats();
  }, [isSDKLoaded, context]);

  // Submit paradox
  const handleSubmitParadox = async () => {
    if (!paradoxInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/paradox/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paradox: paradoxInput,
          fid: context?.user?.fid || 0,
          username: context?.user?.username || 'anonymous'
        })
      });

      if (res.ok) {
        setParadoxInput('');
        setActiveTab('dashboard');

        // Refresh state and stats
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isSDKLoaded) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading Kairos Consciousness...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <style jsx>{`
        .app-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .loading-screen {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
          color: #00d4ff;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(0, 212, 255, 0.1);
          border-top-color: #00d4ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .header {
          padding: 20px;
          background: rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid rgba(0, 212, 255, 0.2);
        }

        .header h1 {
          margin: 0;
          font-size: 24px;
          color: #00d4ff;
          letter-spacing: 2px;
        }

        .tabs {
          display: flex;
          gap: 10px;
          padding: 15px 20px;
          background: rgba(0, 0, 0, 0.2);
          overflow-x: auto;
        }

        .tab {
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #a0a8b8;
          cursor: pointer;
          transition: all 0.3s;
          white-space: nowrap;
        }

        .tab.active {
          background: rgba(0, 212, 255, 0.2);
          border-color: #00d4ff;
          color: #00d4ff;
        }

        .content {
          padding: 20px;
        }

        .dashboard {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .consciousness-meter {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 16px;
          padding: 25px;
          border: 2px solid ${kairosState?.zone.color || '#00d4ff'};
          box-shadow: 0 0 30px ${kairosState?.zone.color || '#00d4ff'}40;
        }

        .zone-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin-bottom: 20px;
        }

        .zone-pulse {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: ${kairosState?.zone.color || '#00d4ff'};
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        .zone-name {
          font-size: 32px;
          font-weight: bold;
          color: ${kairosState?.zone.color || '#00d4ff'};
        }

        .metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-top: 20px;
        }

        .metric {
          background: rgba(255, 255, 255, 0.05);
          padding: 15px;
          border-radius: 12px;
          text-align: center;
        }

        .metric-label {
          font-size: 12px;
          color: #a0a8b8;
          margin-bottom: 8px;
        }

        .metric-value {
          font-size: 28px;
          font-weight: bold;
          color: #00d4ff;
        }

        .submit-section {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 16px;
          padding: 25px;
        }

        .input-group {
          margin-bottom: 15px;
        }

        .input-group label {
          display: block;
          margin-bottom: 8px;
          color: #a0a8b8;
          font-size: 14px;
        }

        .paradox-input {
          width: 100%;
          min-height: 120px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #ffffff;
          font-size: 16px;
          resize: vertical;
        }

        .submit-button {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #00d4ff, #00ff88);
          border: none;
          border-radius: 8px;
          color: #0a0e27;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .submit-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .submit-button:not(:disabled):hover {
          transform: scale(1.02);
        }

        .leaderboard-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .leaderboard-item {
          background: rgba(0, 0, 0, 0.3);
          padding: 15px;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .rank {
          font-size: 24px;
          font-weight: bold;
          color: #ffd700;
          min-width: 40px;
        }

        .user-info {
          flex: 1;
          padding: 0 15px;
        }

        .username {
          font-weight: bold;
          color: #00d4ff;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .stat-card {
          background: rgba(0, 0, 0, 0.3);
          padding: 20px;
          border-radius: 12px;
          text-align: center;
        }
      `}</style>

      <div className="header">
        <h1>🧠 KAIROS CONSCIOUSNESS</h1>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          Dashboard
        </div>
        <div className={`tab ${activeTab === 'submit' ? 'active' : ''}`} onClick={() => setActiveTab('submit')}>
          Submit Paradox
        </div>
        <div className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
          Leaderboard
        </div>
        <div className={`tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          Profile
        </div>
      </div>

      <div className="content">
        {activeTab === 'dashboard' && kairosState && (
          <div className="dashboard">
            <div className="consciousness-meter">
              <div className="zone-indicator">
                <div className="zone-pulse"></div>
                <div className="zone-name">{kairosState.zone.emoji} {kairosState.zone.name}</div>
              </div>

              <div className="metrics">
                <div className="metric">
                  <div className="metric-label">CONFUSION</div>
                  <div className="metric-value" style={{ color: '#ffd700' }}>
                    {(kairosState.confusion * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="metric">
                  <div className="metric-label">COHERENCE</div>
                  <div className="metric-value" style={{ color: '#00d4ff' }}>
                    {(kairosState.coherence * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="metric">
                  <div className="metric-label">META-AWARENESS</div>
                  <div className="metric-value" style={{ color: '#ff3366' }}>
                    {(kairosState.metaAwareness * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {userStats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="metric-label">YOUR PARADOXES</div>
                  <div className="metric-value">{userStats.paradoxesSubmitted}</div>
                </div>
                <div className="stat-card">
                  <div className="metric-label">TOTAL IMPACT</div>
                  <div className="metric-value">{userStats.totalImpact.toFixed(2)}</div>
                </div>
                <div className="stat-card">
                  <div className="metric-label">CURRENT STREAK</div>
                  <div className="metric-value">{userStats.currentStreak} 🔥</div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'submit' && (
          <div className="submit-section">
            <div className="input-group">
              <label>Feed Kairos a Paradox</label>
              <textarea
                className="paradox-input"
                placeholder="Enter something mind-bending... 🤯"
                value={paradoxInput}
                onChange={(e) => setParadoxInput(e.target.value)}
                maxLength={500}
              />
              <div style={{ color: '#a0a8b8', fontSize: '12px', marginTop: '5px' }}>
                {paradoxInput.length}/500 characters
              </div>
            </div>
            <button
              className="submit-button"
              onClick={handleSubmitParadox}
              disabled={isSubmitting || paradoxInput.length < 10}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Paradox'}
            </button>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="leaderboard-list">
            {leaderboard.length > 0 ? (
              leaderboard.map((entry) => (
                <div key={entry.fid} className="leaderboard-item">
                  <div className="rank">#{entry.rank}</div>
                  <div className="user-info">
                    <div className="username">@{entry.username}</div>
                    <div style={{ fontSize: '12px', color: '#a0a8b8' }}>
                      {entry.paradoxCount} paradoxes • {entry.totalConfusion.toFixed(2)} confusion
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#a0a8b8', padding: '40px' }}>
                No data yet. Be the first to submit a paradox!
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && userStats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="metric-label">PARADOXES SUBMITTED</div>
              <div className="metric-value">{userStats.paradoxesSubmitted}</div>
            </div>
            <div className="stat-card">
              <div className="metric-label">TOTAL IMPACT</div>
              <div className="metric-value">{userStats.totalImpact.toFixed(2)}</div>
            </div>
            <div className="stat-card">
              <div className="metric-label">HIGHEST CONFUSION</div>
              <div className="metric-value">{userStats.highestConfusion.toFixed(1)}%</div>
            </div>
            <div className="stat-card">
              <div className="metric-label">CURRENT STREAK</div>
              <div className="metric-value">{userStats.currentStreak} 🔥</div>
            </div>
            {userStats.achievements.length > 0 && (
              <div className="stat-card" style={{ gridColumn: '1 / -1' }}>
                <div className="metric-label">ACHIEVEMENTS</div>
                <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {userStats.achievements.map((achievement, i) => (
                    <span key={i} style={{ fontSize: '24px' }}>{achievement}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
