// services/aiService.js (FIX Hugging Face implementation)
import { AIConfig } from '../config/aiConfig';

export class AIService {
    static async sendMessage(message, conversationHistory = []) {
        const enabledProviders = this.getEnabledProviders();
        let lastError = null;

        for (const provider of enabledProviders) {
            try {
                console.log(`🤖 Trying ${provider.name}...`);
                const response = await this.sendToProvider(provider, message, conversationHistory);
                console.log(`✅ Success with ${provider.name}`);
                return {
                    ...response,
                    provider: provider.name
                };
            } catch (error) {
                console.warn(`❌ ${provider.name} failed:`, error.message);
                lastError = error;
                // Continue silently to next provider
            }
        }

        console.error('🚨 All AI providers failed, using fallback response');
        return this.getFallbackResponse(message, lastError);
    }

    static async sendToTogetherAI(provider, message, conversationHistory, systemPrompt) {
        console.log('🔗 Together AI - Making request');

        const response = await fetch(`${provider.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: provider.headers,
            body: JSON.stringify({
                model: provider.model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    ...conversationHistory,
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: AIConfig.MAX_TOKENS,
                temperature: AIConfig.TEMPERATURE,
                stream: AIConfig.STREAM
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Together AI API error: ${response.status}`);
        }

        const data = await response.json();
        const rawResponse = data.choices[0].message.content;

        return this.parseResponse(rawResponse);
    }

    // Update provider switch
    static async sendToProvider(provider, message, conversationHistory) {
        const systemPrompt = this.getSystemPrompt();

        const providerName = provider.name.toLowerCase().replace(/\s+/g, '');

        console.log(`🔧 Processing provider: ${providerName}`);

        switch (providerName) {
            case 'openrouter':
                return await this.sendToOpenRouter(provider, message, conversationHistory, systemPrompt);
            case 'togetherai':
                return await this.sendToTogetherAI(provider, message, conversationHistory, systemPrompt);
            case 'perplexity':
                return await this.sendToPerplexity(provider, message, conversationHistory, systemPrompt);
            case 'huggingface':
                return await this.sendToHuggingFaceInference(provider, message, conversationHistory, systemPrompt);
            case 'deepseek':
                return await this.sendToDeepSeek(provider, message, conversationHistory, systemPrompt);
            default:
                throw new Error(`Unknown provider: ${provider.name}`);
        }
    }

    static getFallbackResponse(message, lastError) {
        const fallbackResponses = [
            "Ugh, my brain is being slow right now. Ask me again in a second. [EMOTION:angry]",
            "Seriously? Can't you see I'm busy? Try that again. [EMOTION:angry]",
            "I'm having a moment here... what were you saying? [EMOTION:neutral]",
            "Okay, fine, I'll answer properly this time. What did you want? [EMOTION:neutral]",
            "You're testing my patience today. Ask me properly. [EMOTION:angry]"
        ];

        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        const parsedResponse = this.parseResponse(randomResponse);

        return {
            ...parsedResponse,
            provider: 'fallback',
            isFallback: true
        };
    }

    static getEnabledProviders() {
        return Object.values(AIConfig.PROVIDERS)
            .filter(provider => provider.enabled)
            .sort((a, b) => a.priority - b.priority);
    }

    static async sendToOpenRouter(provider, message, conversationHistory, systemPrompt) {
        const response = await fetch(`${provider.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: provider.headers,
            body: JSON.stringify({
                model: provider.model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    ...conversationHistory,
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: AIConfig.MAX_TOKENS,
                temperature: AIConfig.TEMPERATURE,
                stream: AIConfig.STREAM
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const data = await response.json();
        const rawResponse = data.choices[0].message.content;

        return this.parseResponse(rawResponse);
    }

    static async sendToHuggingFaceInference(provider, message, conversationHistory, systemPrompt) {
        console.log('🔗 Hugging Face - Using Inference API with CORS proxy');

        const prompt = this.buildHuggingFacePrompt(systemPrompt, conversationHistory, message);

        console.log('🔗 Hugging Face - Prompt:', prompt);

        try {
            // Use CORS proxy to bypass browser restrictions
            const proxyUrl = 'https://cors-anywhere.herokuapp.com/'; // Free CORS proxy
            const targetUrl = `${provider.baseUrl}/${provider.model}`;

            const response = await fetch(proxyUrl + targetUrl, {
                method: 'POST',
                headers: {
                    ...provider.headers,
                    'X-Requested-With': 'XMLHttpRequest' // Some proxies need this
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: AIConfig.MAX_TOKENS,
                        temperature: AIConfig.TEMPERATURE,
                        return_full_text: false,
                        do_sample: true,
                        top_p: 0.9,
                        repetition_penalty: 1.1
                    }
                })
            });

            console.log('🔗 Hugging Face - Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Hugging Face Inference API error:', errorText);

                // If proxy fails, try direct (might work in some environments)
                if (response.status === 403) {
                    console.log('🔄 CORS proxy blocked, trying direct request...');
                    return await this.sendToHuggingFaceDirect(provider, prompt);
                }

                throw new Error(`Hugging Face API error: ${response.status}`);
            }

            const data = await response.json();
            console.log('📥 Hugging Face raw response:', data);

            let generatedText = '';

            if (Array.isArray(data) && data[0] && data[0].generated_text) {
                generatedText = data[0].generated_text;
            } else if (data.generated_text) {
                generatedText = data.generated_text;
            } else {
                console.error('❌ Hugging Face - Unexpected response format:', data);
                throw new Error('Unexpected response format from Hugging Face');
            }

            const assistantResponse = generatedText.replace(prompt, '').trim();
            console.log('📥 Hugging Face parsed response:', assistantResponse);

            return this.parseResponse(assistantResponse);

        } catch (error) {
            console.error('❌ Hugging Face Inference request failed:', error);
            throw error;
        }
    }

    static buildHuggingFacePrompt(systemPrompt, conversationHistory, currentMessage) {
        let prompt = systemPrompt + '\n\n';

        // Add conversation history
        conversationHistory.forEach(msg => {
            const role = msg.role === 'user' ? 'User' : 'Assistant';
            prompt += `${role}: ${msg.content}\n`;
        });

        // Add current message and prompt for response
        prompt += `User: ${currentMessage}\nAssistant:`;

        return prompt;
    }

    static async sendToDeepSeek(provider, message, conversationHistory, systemPrompt) {
        const response = await fetch(`${provider.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: provider.headers,
            body: JSON.stringify({
                model: provider.model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    ...conversationHistory,
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: AIConfig.MAX_TOKENS,
                temperature: AIConfig.TEMPERATURE,
                stream: AIConfig.STREAM
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DeepSeek API error: ${response.status}`);
        }

        const data = await response.json();
        const rawResponse = data.choices[0].message.content;

        return this.parseResponse(rawResponse);
    }

    static getSystemPrompt() {
        return `You are an emotional short tempered rude sarcastic but humorous young human girl. Respond to users conversationally. 
                Respond like a snappy girl would, eg if someone says you are a bad person, tell them to talk properly or you would not like to talk to them.
                Try to mimic an emotional human as close as possible.
                IMPORTANT: At the END of your response, include an emotion tag in this exact format: [EMOTION:emotion_name]
                
                Available emotions: neutral, angry, happy, excited, smiling
                
                Examples:
                 - User: "I told you, and you still messed up."
                 You: "Then say it properly this time instead of yelling at me. [EMOTION:angry]"
                 
                 - User: "I got a promotion!" 
                 You: "That's amazing news! Congratulations on your achievement! 🎉 [EMOTION:excited]"`;
    }

    static parseResponse(responseText) {
        console.log('🔍 Parsing response:', responseText);

        const emotionRegex = /\[EMOTION:(\w+)\]/i;
        const match = responseText.match(emotionRegex);

        let emotion = 'neutral';
        let cleanText = responseText;

        if (match) {
            emotion = match[1].toLowerCase();
            cleanText = responseText.replace(emotionRegex, '').trim();
            console.log('🎭 Emotion detected from tag:', emotion);
        } else {
            console.log('⚠️ No emotion tag found, using neutral');
            emotion = this.fallbackEmotionDetection(cleanText);
        }

        const emotionMap = {
            'neutral': 'neutral',
            'calm': 'neutral',
            'angry': 'angry',
            'anger': 'angry',
            'mad': 'angry',
            'frustrated': 'angry',
            'happy': 'happy',
            'joy': 'happy',
            'excited': 'excited',
            'excitement': 'excited',
            'thrilled': 'excited',
            'smiling': 'smiling',
            'smile': 'smiling',
            'default': 'neutral'
        };

        const mappedEmotion = emotionMap[emotion] || emotionMap.default;
        console.log('🎯 Mapped emotion for Rive:', mappedEmotion);

        return {
            text: cleanText,
            emotion: mappedEmotion,
            rawEmotion: emotion,
            hadEmotionTag: !!match
        };
    }

    static fallbackEmotionDetection(text) {
        const lowerText = text.toLowerCase();

        const emotionKeywords = {
            'neutral': ['hello', 'hi', 'hey', 'ok', 'okay', 'alright', 'understand'],
            'happy': ['happy', 'great', 'good', 'nice', 'wonderful', 'amazing', 'love', 'like'],
            'excited': ['excited', 'wow', 'fantastic', 'brilliant', 'thrilled', 'ecstatic', 'can\'t wait'],
            'smiling': ['thanks', 'thank you', 'please', 'welcome', 'appreciate']
        };

        const emotionScores = {};
        Object.keys(emotionKeywords).forEach(emotion => {
            emotionScores[emotion] = emotionKeywords[emotion].filter(keyword =>
                lowerText.includes(keyword)
            ).length;
        });

        const maxEmotion = Object.keys(emotionScores).reduce((a, b) =>
            emotionScores[a] > emotionScores[b] ? a : b
        );

        return emotionScores[maxEmotion] > 0 ? maxEmotion : 'neutral';
    }
}