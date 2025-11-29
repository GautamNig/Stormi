// components/AIChatTooltip.jsx (FIXED)
import React, { useEffect, useState, useRef } from 'react';
import './AIChatTooltip.css';
import { ChatConfig } from '../config/chatConfig';

export default function AIChatTooltip({ 
    message, 
    onExpire, 
    speakText, 
    stopSpeaking, 
    isSpeakableText, 
    isMuted 
}) {
    const [isVisible, setIsVisible] = useState(true);
    const [isFading, setIsFading] = useState(false);
    const hasSpokenRef = useRef(false);
    const speechTimeoutRef = useRef(null);

    useEffect(() => {
        console.log('🔊 AIChatTooltip mounted with message:', message.text);
        
        // Speak when tooltip appears (if text is speakable and hasn't been spoken yet and not muted)
        if (isSpeakableText(message.text) && !hasSpokenRef.current && !isMuted) {
            console.log('🔊 Triggering TTS for message:', message.text);
            // Use a small timeout to ensure component is fully mounted
            speechTimeoutRef.current = setTimeout(() => {
                speakText(message.text);
                hasSpokenRef.current = true;
            }, 100);
        } else {
            console.log('🔊 TTS skipped - reasons:', {
                speakable: isSpeakableText(message.text),
                alreadySpoken: hasSpokenRef.current,
                muted: isMuted
            });
        }

        const fadeTimer = setTimeout(() => {
            setIsFading(true);
        }, ChatConfig.COOLDOWN_PERIOD - 500);

        const removeTimer = setTimeout(() => {
            console.log('🔊 Tooltip expiring, stopping TTS');
            setIsVisible(false);
            stopSpeaking();
            onExpire(message.id);
        }, ChatConfig.COOLDOWN_PERIOD);

        return () => {
            console.log('🔊 AIChatTooltip cleanup');
            clearTimeout(fadeTimer);
            clearTimeout(removeTimer);
            clearTimeout(speechTimeoutRef.current);
            // Don't stop speaking here - let the tooltip lifecycle handle it
        };
    }, [
        message.id, 
        onExpire, 
        message.text, 
        speakText, 
        stopSpeaking, 
        isSpeakableText, 
        isMuted
    ]);

    if (!isVisible) return null;

    const tooltipStyle = {
        right: '840px',
        top: '40vh',
        transform: 'translateY(-50%)'
    };

    const tooltipClass = `ai-chat-tooltip ${isFading ? 'fading' : ''} emotion-${message.emotion} right-position`;

    return (
        <div className={tooltipClass} style={tooltipStyle}>
            <div className="ai-tooltip-bubble">
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