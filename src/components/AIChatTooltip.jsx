import React, { useEffect, useState } from 'react';
import './AIChatTooltip.css';
import { ChatConfig } from '../config/chatConfig';

export default function AIChatTooltip({ message, onExpire }) {
    const [isVisible, setIsVisible] = useState(true);
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsFading(true);
        }, ChatConfig.COOLDOWN_PERIOD - 500); // Start fade out 500ms before removal

        const removeTimer = setTimeout(() => {
            setIsVisible(false);
            onExpire(message.id);
        }, ChatConfig.COOLDOWN_PERIOD);

        return () => {
            clearTimeout(timer);
            clearTimeout(removeTimer);
        };
    }, [message.id, onExpire]);

    if (!isVisible) return null;

    // Position tooltip on the right side of the screen, pointing towards the animation
    const tooltipStyle = {
        right: '840px', // Position from right edge
        top: '40vh', // Center vertically
        transform: 'translateY(-50%)' // Center vertically
    };

    const tooltipClass = `ai-chat-tooltip ${isFading ? 'fading' : ''} emotion-${message.emotion} right-position`;

    return (
        <div className={tooltipClass} style={tooltipStyle}>
            <div className="ai-tooltip-bubble">
                {/* Pointer pointing left and down towards animation */}
                <div className="tooltip-pointer"></div>
                
                <div className="ai-message-header">
                    <span className="ai-username">{message.user}</span>
                    <span className="ai-emotion-indicator">
                        {getEmojiForEmotion(message.emotion)}
                    </span>
                </div>
                <div className="ai-message-content">
                    {message.text}
                </div>
            </div>
        </div>
    );
}

function getEmojiForEmotion(emotion) {
    const emojiMap = {
        'happy': '😄',
        'excited': '🎉',
        'smiling': '😊',
        'angry': '😠',
        'neutral': '😐'
    };
    return emojiMap[emotion] || '🤖';
}