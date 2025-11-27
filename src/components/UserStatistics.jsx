import React, { useState, useEffect } from 'react';
import { MessageService } from '../services/messageService';
import { useAuth } from '../hooks/useAuth';
import './UserStatistics.css';

export default function UserStatistics() {
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [needsIndex, setNeedsIndex] = useState(false);

    const emotionColors = {
        'happy': '#4CAF50',
        'angry': '#F44336', 
        'neutral': '#9E9E9E',
        'excited': '#FF9800',
        'smiling': '#2196F3'
    };

    const emotionIcons = {
        'happy': '😄',
        'angry': '😠',
        'neutral': '😐',
        'excited': '🎉',
        'smiling': '😊'
    };

    const loadStatistics = async () => {
        if (!user) return;
        
        setLoading(true);
        setError(null);
        setNeedsIndex(false);
        
        try {
            const stats = await MessageService.getEmotionStatistics(user.uid);
            setStatistics(stats);
        } catch (err) {
            if (err.code === 'failed-precondition') {
                setNeedsIndex(true);
                setError('Firebase index is being created. This may take a few minutes.');
            } else {
                setError('Failed to load statistics');
            }
            console.error('Error loading statistics:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isExpanded && user) {
            loadStatistics();
        }
    }, [isExpanded, user]);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    if (!user) {
        return null;
    }

    return (
        <div className="user-statistics">
            <button 
                className="statistics-toggle"
                onClick={toggleExpand}
            >
                📊 User Statistics {isExpanded ? '▲' : '▼'}
            </button>

            {isExpanded && (
                <div className="statistics-content">
                    {loading && (
                        <div className="statistics-loading">
                            <div className="loading-spinner"></div>
                            Loading statistics...
                        </div>
                    )}

                    {error && (
                        <div className="statistics-error">
                            {error}
                            {needsIndex && (
                                <div className="index-notice">
                                    <p>Firebase is creating the required index. This usually takes 2-5 minutes.</p>
                                    <p>You can continue using the app - messages are being saved and statistics will appear once the index is ready.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {statistics && statistics.totalMessages > 0 ? (
                        <div className="statistics-data">
                            <div className="statistics-header">
                                <h3>Emotion Distribution</h3>
                                <div className="total-messages">
                                    Total Messages: {statistics.totalMessages}
                                </div>
                            </div>

                            {/* Pie Chart Visualization */}
                            <div className="pie-chart-container">
                                <div className="pie-chart">
                                    <svg width="120" height="120" viewBox="0 0 120 120">
                                        <PieSegments percentages={statistics.percentages} colors={emotionColors} />
                                    </svg>
                                </div>
                                <div className="pie-legend">
                                    {Object.entries(statistics.percentages).map(([emotion, percentage]) => (
                                        percentage > 0 && (
                                            <div key={emotion} className="legend-item">
                                                <div 
                                                    className="legend-color" 
                                                    style={{ backgroundColor: emotionColors[emotion] }}
                                                ></div>
                                                <span className="legend-label">
                                                    {emotionIcons[emotion]} {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                                                </span>
                                                <span className="legend-value">
                                                    {statistics.counts[emotion]} ({percentage}%)
                                                </span>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>

                            {/* Detailed Breakdown */}
                            <div className="detailed-breakdown">
                                <h4>Detailed Breakdown</h4>
                                {Object.entries(statistics.counts).map(([emotion, count]) => (
                                    emotion !== 'total' && (
                                        <div key={emotion} className="breakdown-item">
                                            <div className="breakdown-header">
                                                <span className="emotion-icon">{emotionIcons[emotion]}</span>
                                                <span className="emotion-name">{emotion}</span>
                                                <span className="emotion-count">{count}</span>
                                            </div>
                                            <div className="breakdown-bar">
                                                <div 
                                                    className="breakdown-fill"
                                                    style={{
                                                        width: `${statistics.percentages[emotion]}%`,
                                                        backgroundColor: emotionColors[emotion]
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="breakdown-percentage">
                                                {statistics.percentages[emotion]}%
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    ) : statistics && statistics.totalMessages === 0 ? (
                        <div className="no-data">
                            No messages yet. Start chatting to see your statistics!
                            <div className="saving-info">
                                Messages are being saved to Firebase. Check the Firestore console to see your messages.
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}

// SVG Pie Chart Component
function PieSegments({ percentages, colors }) {
    const centerX = 60;
    const centerY = 60;
    const radius = 50;
    
    let currentAngle = 0;
    const segments = [];

    // Filter emotions that have percentage > 0
    const activeEmotions = Object.entries(percentages)
        .filter(([emotion, percentage]) => percentage > 0)
        .sort((a, b) => b[1] - a[1]); // Sort by percentage descending

    activeEmotions.forEach(([emotion, percentage]) => {
        const angle = (percentage / 100) * 360;
        
        // Calculate start and end points for the arc
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        
        const startRadians = (startAngle - 90) * (Math.PI / 180);
        const endRadians = (endAngle - 90) * (Math.PI / 180);
        
        const startX = centerX + radius * Math.cos(startRadians);
        const startY = centerY + radius * Math.sin(startRadians);
        const endX = centerX + radius * Math.cos(endRadians);
        const endY = centerY + radius * Math.sin(endRadians);
        
        // Determine if the arc is large (more than 180 degrees)
        const largeArcFlag = angle > 180 ? 1 : 0;
        
        // Create the path for the pie segment
        const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${startX} ${startY}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            'Z'
        ].join(' ');
        
        segments.push(
            <path
                key={emotion}
                d={pathData}
                fill={colors[emotion]}
                stroke="#ffffff"
                strokeWidth="2"
            />
        );
        
        currentAngle += angle;
    });

    return (
        <g>
            {segments}
            {/* Center circle for donut effect (optional) */}
            <circle cx={centerX} cy={centerY} r={radius * 0.3} fill="white" />
        </g>
    );
}