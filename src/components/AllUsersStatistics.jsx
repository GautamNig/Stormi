// components/AllUsersStatistics.jsx
import React, { useState, useEffect } from 'react';
import { AllUsersStatsService } from '../services/allUsersStatsService';
import { useAuth } from '../hooks/useAuth';
import './AllUsersStatistics.css';

export default function AllUsersStatistics() {
    const { user } = useAuth();
    const [usersStats, setUsersStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'totalMessages', direction: 'desc' });

    useEffect(() => {
        loadAllUsersStatistics();
    }, []);

    const loadAllUsersStatistics = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const stats = await AllUsersStatsService.getAllUsersStatistics();
            setUsersStats(stats);
        } catch (err) {
            console.error('Error loading all users statistics:', err);
            setError('Failed to load statistics. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sortedUsers = [...usersStats].sort((a, b) => {
        if (sortConfig.key === 'userName') {
            return sortConfig.direction === 'asc' 
                ? a.userName.localeCompare(b.userName)
                : b.userName.localeCompare(a.userName);
        }
        
        if (sortConfig.key === 'lastActivity') {
            const aTime = a.lastActivity ? new Date(a.lastActivity) : new Date(0);
            const bTime = b.lastActivity ? new Date(b.lastActivity) : new Date(0);
            return sortConfig.direction === 'asc' 
                ? aTime - bTime 
                : bTime - aTime;
        }

        const aValue = a[sortConfig.key] || a.percentages[sortConfig.key] || 0;
        const bValue = b[sortConfig.key] || b.percentages[sortConfig.key] || 0;
        
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return '↕️';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    // Highlight current user in the table
    const isCurrentUser = (userStat) => {
        return user && userStat.userId === user.uid;
    };

    return (
        <div className="all-users-statistics">
            <div className="all-users-header">
                <h2>📊 All Users Statistics</h2>
                <p>Compare emotional response patterns across all users</p>
                <div className="all-users-controls">
                    <button 
                        onClick={loadAllUsersStatistics}
                        className="refresh-btn"
                        disabled={loading}
                    >
                        {loading ? 'Refreshing...' : '🔄 Refresh'}
                    </button>
                    <div className="stats-summary">
                        Total Users: {usersStats.length} | 
                        Total Messages: {usersStats.reduce((sum, user) => sum + user.totalMessages, 0)}
                    </div>
                </div>
            </div>

            {error && (
                <div className="all-users-error">
                    {error}
                    <button onClick={loadAllUsersStatistics}>Retry</button>
                </div>
            )}

            {loading ? (
                <div className="all-users-loading">
                    <div className="loading-spinner"></div>
                    Loading all users statistics...
                </div>
            ) : (
                <div className="all-users-table-container">
                    <table className="all-users-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('userName')}>
                                    User {getSortIcon('userName')}
                                </th>
                                <th onClick={() => handleSort('totalMessages')}>
                                    Total Messages {getSortIcon('totalMessages')}
                                </th>
                                <th onClick={() => handleSort('lastActivity')}>
                                    Last Activity {getSortIcon('lastActivity')}
                                </th>
                                <th>😄 Happy</th>
                                <th>😠 Angry</th>
                                <th>😐 Neutral</th>
                                <th>🎉 Excited</th>
                                <th>😊 Smiling</th>
                                <th>Emotion Distribution</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedUsers.map(userStat => (
                                <UserStatsRow 
                                    key={userStat.userId} 
                                    userStat={userStat} 
                                    isCurrentUser={isCurrentUser(userStat)}
                                />
                            ))}
                        </tbody>
                    </table>

                    {usersStats.length === 0 && (
                        <div className="no-data-message">
                            No user data available. Start chatting to see statistics!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// User Stats Row Component
function UserStatsRow({ userStat, isCurrentUser }) {
    const [showDetails, setShowDetails] = useState(false);

    const formatLastActivity = (timestamp) => {
        if (!timestamp) return 'Never';
        return new Date(timestamp).toLocaleDateString();
    };

    const emotions = ['happy', 'angry', 'neutral', 'excited', 'smiling'];

    return (
        <>
            <tr className={`user-stats-row ${isCurrentUser ? 'current-user' : ''}`} 
                onClick={() => setShowDetails(!showDetails)}>
                <td className="user-info">
                    <div className="user-avatar">
                        {userStat.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                        <div className="user-name">
                            {userStat.userName}
                            {isCurrentUser && <span className="you-badge"> (You)</span>}
                        </div>
                        <div className="user-email">{userStat.userEmail}</div>
                    </div>
                </td>
                <td className="total-messages">
                    <strong>{userStat.totalMessages}</strong>
                </td>
                <td className="last-activity">
                    {formatLastActivity(userStat.lastActivity)}
                </td>
                {emotions.map(emotion => (
                    <td key={emotion} className="emotion-cell">
                        <div className="emotion-percentage">
                            {userStat.percentages[emotion]}%
                        </div>
                        <div className="emotion-count">
                            ({userStat.emotionCounts[emotion]})
                        </div>
                    </td>
                ))}
                <td className="distribution-cell">
                    <EmotionDistributionBar percentages={userStat.percentages} />
                </td>
            </tr>
            
            {showDetails && (
                <tr className="user-details-row">
                    <td colSpan="9">
                        <div className="user-details-expanded">
                            <h4>Detailed Emotion Breakdown for {userStat.userName} {isCurrentUser && '(You)'}</h4>
                            <div className="detailed-breakdown">
                                {emotions.map(emotion => (
                                    <div key={emotion} className="detail-item">
                                        <span className="emotion-icon">
                                            {AllUsersStatsService.getEmotionIcon(emotion)}
                                        </span>
                                        <span className="emotion-label">{emotion}</span>
                                        <div className="detail-bar">
                                            <div 
                                                className="detail-fill"
                                                style={{
                                                    width: `${userStat.percentages[emotion]}%`,
                                                    backgroundColor: AllUsersStatsService.getEmotionColor(emotion)
                                                }}
                                            ></div>
                                        </div>
                                        <span className="detail-percentage">
                                            {userStat.percentages[emotion]}%
                                        </span>
                                        <span className="detail-count">
                                            ({userStat.emotionCounts[emotion]} messages)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// Emotion Distribution Bar Component
function EmotionDistributionBar({ percentages }) {
    const emotions = ['happy', 'angry', 'neutral', 'excited', 'smiling'];
    
    return (
        <div className="distribution-bar">
            {emotions.map(emotion => (
                percentages[emotion] > 0 && (
                    <div
                        key={emotion}
                        className="distribution-segment"
                        style={{
                            width: `${percentages[emotion]}%`,
                            backgroundColor: AllUsersStatsService.getEmotionColor(emotion)
                        }}
                        title={`${emotion}: ${percentages[emotion]}%`}
                    ></div>
                )
            ))}
        </div>
    );
}