// components/Leaderboard.jsx
import React, { useState, useEffect } from 'react';
import { GlobalMessagesService } from '../services/GlobalMessagesService';
import './Leaderboard.css';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'weekly', 'monthly'

  useEffect(() => {
    loadLeaderboard();
  }, [timeRange]);

  const loadLeaderboard = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const topUsers = await GlobalMessagesService.getTopUsers(10);
    setLeaderboard(topUsers);
  } catch (err) {
    console.error('Error loading leaderboard:', err);
    setError('Failed to load leaderboard. Using sample data.');
    // Fallback to sample data
    setLeaderboard([
      { id: '1', userName: 'User 1', totalPoints: 100 },
      { id: '2', userName: 'User 2', totalPoints: 80 },
      { id: '3', userName: 'User 3', totalPoints: 60 }
    ]);
  } finally {
    setLoading(false);
  }
};
  // Add this function to GlobalMessagesService.js
  /*
  static async getTopUsers(limit = 10) {
    const userPointsRef = collection(db, 'user_points');
    const q = query(
      userPointsRef,
      orderBy('totalPoints', 'desc'),
      limit(limit)
    );
    
    const snapshot = await getDocs(q);
    const users = [];
    
    snapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return users;
  }
  */

  if (loading) {
    return (
      <div className="leaderboard-loading">
        <div className="loading-spinner"></div>
        Loading leaderboard...
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h3>🏆 Leaderboard</h3>
        <div className="time-range-selector">
          <button 
            className={`time-btn ${timeRange === 'all' ? 'active' : ''}`}
            onClick={() => setTimeRange('all')}
          >
            All Time
          </button>
          <button 
            className={`time-btn ${timeRange === 'weekly' ? 'active' : ''}`}
            onClick={() => setTimeRange('weekly')}
          >
            This Week
          </button>
          <button 
            className={`time-btn ${timeRange === 'monthly' ? 'active' : ''}`}
            onClick={() => setTimeRange('monthly')}
          >
            This Month
          </button>
        </div>
      </div>

      {error && (
        <div className="leaderboard-error">
          {error}
          <button onClick={loadLeaderboard}>Retry</button>
        </div>
      )}

      <div className="leaderboard-list">
        {leaderboard.map((user, index) => (
          <LeaderboardItem 
            key={user.id}
            user={user}
            rank={index + 1}
          />
        ))}
        
        {leaderboard.length === 0 && !loading && (
          <div className="no-leaderboard-data">
            No leaderboard data yet. Be the first to earn points!
          </div>
        )}
      </div>
    </div>
  );
}

function LeaderboardItem({ user, rank }) {
  const getRankColor = (rank) => {
    switch(rank) {
      case 1: return '#ffd700'; // Gold
      case 2: return '#c0c0c0'; // Silver
      case 3: return '#cd7f32'; // Bronze
      default: return '#6c757d';
    }
  };

  return (
    <div className="leaderboard-item">
      <div className="rank-badge" style={{ backgroundColor: getRankColor(rank) }}>
        {rank}
      </div>
      
      <div className="user-info">
        <img 
          src={user.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.userName)}&background=random`}
          alt={user.userName}
          className="user-avatar"
        />
        <div className="user-details">
          <div className="user-name">{user.userName}</div>
          <div className="user-stats">
            <span className="stat">Messages: {user.totalMessages || 0}</span>
            <span className="stat">Likes: {user.totalLikes || 0}</span>
          </div>
        </div>
      </div>
      
      <div className="user-points">
        <div className="points-value">{user.totalPoints || 0}</div>
        <div className="points-label">Points</div>
      </div>
    </div>
  );
}