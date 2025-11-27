import { AIConfig } from '../config/aiConfig';

export class OpenRouterService {
    static async sendMessage(message, conversationHistory = []) {
        try {
            console.log('📤 Sending message to OpenRouter:', message);
            
            const response = await fetch(`${AIConfig.OPENROUTER_BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AIConfig.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Emotional AI Companion'
                },
                body: JSON.stringify({
                    model: AIConfig.OPENROUTER_MODEL,
                    messages: [
                        {
                            role: 'system',
                            content: `You are an emotional AI companion. Respond to users conversationally. 
                                    IMPORTANT: At the END of your response, include an emotion tag in this exact format: [EMOTION:emotion_name]
                                    
                                    Available emotions: neutral, angry, happy, excited, smiling
                                    
                                    Examples:
                                    - User: "I got a promotion!" 
                                      You: "That's amazing news! Congratulations on your achievement! 🎉 [EMOTION:excited]"
                                    - User: "I'm feeling sad today"
                                      You: "I'm sorry you're feeling that way. I'm here for you. [EMOTION:neutral]"
                                    - User: "This is frustrating!"
                                      You: "I understand your frustration. That sounds really tough. [EMOTION:angry]"
                                    - User: "Hello!"
                                      You: "Hi there! Great to see you! 😊 [EMOTION:smiling]"
                                    - User: "I just won the lottery!"
                                      You: "Wow! That's incredible! I'm so happy for you! 🎊 [EMOTION:happy]"`
                        },
                        ...conversationHistory,
                        {
                            role: 'user',
                            content: message
                        }
                    ],
                    max_tokens: 150,
                    temperature: 0.7,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            const rawResponse = data.choices[0].message.content;
            console.log('📥 Raw AI Response:', rawResponse);
            
            return this.parseResponse(rawResponse);
            
        } catch (error) {
            console.error('OpenRouter API error:', error);
            throw error;
        }
    }

    static parseResponse(responseText) {
        console.log('🔍 Parsing response:', responseText);
        
        // Extract emotion tag from response - look for [EMOTION:emotion_name]
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
            // If no emotion tag found, use client-side detection as fallback
            emotion = this.fallbackEmotionDetection(cleanText);
        }

        // CORRECT EMOTION MAPPING FOR RIVE ANIMATION (based on your mapping)
        const emotionMap = {
            // Rive Expression Values:
            // 0 = neutral, 1 = angry, 2 = happy, 3 = excited, 4 = smiling
            'neutral': 'neutral',    // Expression: 0
            'calm': 'neutral',
            'angry': 'angry',        // Expression: 1
            'anger': 'angry',
            'mad': 'angry',
            'frustrated': 'angry',
            'happy': 'happy',        // Expression: 2
            'joy': 'happy',
            'excited': 'excited',    // Expression: 3
            'excitement': 'excited',
            'thrilled': 'excited',
            'smiling': 'smiling',    // Expression: 4
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

    // Fallback: Only use if no emotion tag found
    static fallbackEmotionDetection(text) {
        const lowerText = text.toLowerCase();
        
        const emotionKeywords = {
            'neutral': ['hello', 'hi', 'hey', 'ok', 'okay', 'alright', 'understand'],
            'angry': ['angry', 'mad', 'frustrated', 'annoyed', 'hate', 'dislike', 'terrible', 'awful'],
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