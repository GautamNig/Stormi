import { useState, useCallback } from 'react';
import { OpenRouterService } from '../services/openRouterService';
import { MessageService } from '../services/messageService';
import { AIConfig } from '../config/aiConfig';

export default function useChatMessages() {
    const [chatMessages, setChatMessages] = useState([]);
    const [conversationHistory, setConversationHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [rateLimit, setRateLimit] = useState({ requests: 0, lastRequest: 0 });

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

            // Get AI response
            const aiResponse = await OpenRouterService.sendMessage(userMessage, updatedHistory);
            console.log('💾 Attempting to save message to Firebase...');
            // Save message to Firebase
            try {
            await MessageService.saveMessage(user, userMessage, aiResponse, aiResponse.emotion);
            console.log('✅ Message saved successfully to Firebase');
        } catch (saveError) {
            console.error('❌ Failed to save message to Firebase:', saveError);
            // Continue with the flow even if saving fails
        }
            
            // Create chat message object
            const newChatMessage = {
    id: Date.now(),
    text: aiResponse.text,
    emotion: aiResponse.emotion,
    user: 'AI Companion',
    timestamp: new Date().toISOString(),
    // Remove the random position - tooltip will use fixed positioning
    type: 'ai-response',
    userMessage: userMessage
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
            console.error('Error getting AI response:', error);
            
            // Fallback message
            const errorMessage = {
                id: Date.now(),
                text: error.message.includes('Rate limit') 
                    ? "I'm getting too many messages right now! Please wait a moment."
                    : "I'm having trouble responding right now. Please try again!",
                emotion: 'neutral',
                user: 'AI Companion',
                timestamp: new Date().toISOString(),
                position: { x: 50, y: 30 },
                type: 'ai-response',
                userMessage: userMessage
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
        addChatMessage,
        removeChatMessage,
        clearChatMessages
    };
}