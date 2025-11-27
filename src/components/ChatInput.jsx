import React, { useState, useRef, useEffect } from 'react';
import { ChatConfig } from '../config/chatConfig';
import './ChatInput.css';

const ChatInput = ({ onSendMessage, disabled = false }) => {
    const [message, setMessage] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const [isSending, setIsSending] = useState(false);
    const inputRef = useRef(null);
    const cooldownRef = useRef(null);

    // Cooldown timer effect
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => {
                setCooldown(prev => {
                    if (prev <= 1000) {
                        clearTimeout(cooldownRef.current);
                        return 0;
                    }
                    return prev - 1000;
                });
            }, 1000);
            
            cooldownRef.current = timer;
        }

        return () => {
            if (cooldownRef.current) {
                clearTimeout(cooldownRef.current);
            }
        };
    }, [cooldown]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!message.trim() || isSending || cooldown > 0 || disabled) {
            return;
        }

        if (message.length > ChatConfig.MAX_MESSAGE_LENGTH) {
            alert(`Message too long! Maximum ${ChatConfig.MAX_MESSAGE_LENGTH} characters allowed.`);
            return;
        }

        if (message.length < ChatConfig.MIN_MESSAGE_LENGTH) {
            alert(`Message too short! Minimum ${ChatConfig.MIN_MESSAGE_LENGTH} character required.`);
            return;
        }

        setIsSending(true);

        try {
            await onSendMessage(message.trim());
            setMessage('');
            setCooldown(ChatConfig.COOLDOWN_PERIOD);
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const formatCooldown = (ms) => {
        return Math.ceil(ms / 1000);
    };

    const isSendDisabled = !message.trim() || isSending || cooldown > 0 || disabled;

    return (
        <div className="chat-input-container">
            <form onSubmit={handleSubmit} className="chat-input-form">
                <div className="input-wrapper">
                    <input
                        ref={inputRef}
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={ChatConfig.PLACEHOLDER_TEXT}
                        disabled={disabled || isSending}
                        maxLength={ChatConfig.MAX_MESSAGE_LENGTH}
                        className="chat-input"
                    />
                    
                    <div className="input-actions">
                        {cooldown > 0 && (
                            <div className="cooldown-indicator">
                                {formatCooldown(cooldown)}s
                            </div>
                        )}
                        
                        <button
                            type="submit"
                            disabled={isSendDisabled}
                            className={`send-button ${isSendDisabled ? 'disabled' : ''}`}
                        >
                            {isSending ? (
                                <div className="loading-spinner"></div>
                            ) : (
                                'Send'
                            )}
                        </button>
                    </div>
                </div>
                
                <div className="message-info">
                    <span className="character-count">
                        {message.length}/{ChatConfig.MAX_MESSAGE_LENGTH}
                    </span>
                    {cooldown > 0 && (
                        <span className="cooldown-text">
                            Patience!! Wait {formatCooldown(cooldown)} seconds before talking to me again.
                        </span>
                    )}
                </div>
            </form>
        </div>
    );
};

export default ChatInput; // Make sure this is at the end