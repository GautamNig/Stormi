// hooks/useChatMessages.js (SIMPLIFIED)
import { useState, useCallback } from 'react';
import { AIService } from '../services/aiService';
import { MessageService } from '../services/messageService';
import { AIConfig } from '../config/aiConfig';

export default function useChatMessages() {
    const [chatMessages, setChatMessages] = useState([]);
    const [conversationHistory, setConversationHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [rateLimit, setRateLimit] = useState({ requests: 0, lastRequest: 0 });
    const [lastProvider, setLastProvider] = useState(null);

    const addChatMessage = useCallback(async (userMessage, user) => {
        if (!userMessage.trim()) return;

        console.log('💬 Starting chat flow for message:', userMessage);

        // Rate limiting check
        const now = Date.now();
        const timeSinceLastRequest = now - rateLimit.lastRequest;

        if (rateLimit.requests >= AIConfig.RATE_LIMIT.REQUESTS_PER_MINUTE &&
            timeSinceLastRequest < 60000) {
            throw new Error('Rate limit exceeded. Please wait a moment before sending another message.');
        }

        setIsLoading(true);

        try {
            // Update rate limit
            setRateLimit(prev => ({
                requests: prev.requests + 1,
                lastRequest: now
            }));

            // Reset rate limit counter after 1 minute
            setTimeout(() => {
                setRateLimit(prev => ({ ...prev, requests: Math.max(0, prev.requests - 1) }));
            }, 60000);

            // Add user message to conversation history
            const updatedHistory = [
                ...conversationHistory,
                { role: 'user', content: userMessage }
            ];

            // Get AI response - this will NEVER throw an error to the user
            const aiResponse = await AIService.sendMessage(userMessage, updatedHistory);
            setLastProvider(aiResponse.provider);
            console.log(lastProvider);
            console.log('lastProvider');
            console.log('💾 Attempting to save message to Firebase...');

            // Save message to Firebase
            try {
                await MessageService.saveMessage(user, userMessage, aiResponse, aiResponse.emotion);
                console.log('✅ Message saved successfully to Firebase');
            } catch (saveError) {
                console.error('❌ Failed to save message to Firebase:', saveError);
            }

            // Create chat message object
            const newChatMessage = {
                id: Date.now(),
                text: aiResponse.text,
                emotion: aiResponse.emotion,
                user: 'AI Companion',
                timestamp: new Date().toISOString(),
                type: 'ai-response',
                userMessage: userMessage,
                provider: aiResponse.provider,
                isFallback: aiResponse.isFallback || false
            };

            // Add to chat messages
            setChatMessages(prev => [...prev, newChatMessage]);

            // Update conversation history with AI response
            setConversationHistory([
                ...updatedHistory,
                { role: 'assistant', content: aiResponse.text }
            ]);

            return newChatMessage;

        } catch (error) {
            // This should only catch rate limit errors, not AI provider errors
            console.error('Unexpected error in chat flow:', error);

            // Even for unexpected errors, provide a graceful response
            const errorMessage = {
                id: Date.now(),
                text: "Okay, fine, I'm here. What did you want to say? [EMOTION:neutral]",
                emotion: 'neutral',
                user: 'AI Companion',
                timestamp: new Date().toISOString(),
                type: 'ai-response',
                userMessage: userMessage,
                provider: 'error-fallback',
                isFallback: true
            };

            setChatMessages(prev => [...prev, errorMessage]);
            return errorMessage;
        } finally {
            setIsLoading(false);
        }
    }, [conversationHistory, rateLimit]);

    const removeChatMessage = useCallback((messageId) => {
        setChatMessages(prev => prev.filter(msg => msg.id !== messageId));
    }, []);

    const clearChatMessages = useCallback(() => {
        setChatMessages([]);
        setConversationHistory([]);
        setRateLimit({ requests: 0, lastRequest: 0 });
    }, []);

    return {
        chatMessages,
        isLoading,
        rateLimit,
        lastProvider,
        addChatMessage,
        removeChatMessage,
        clearChatMessages
    };
}