import { DeepSeekConfig } from '../config/deepseekConfig';

export class DeepSeekService {
    static async sendMessage(message, conversationHistory = []) {
        try {
            const response = await fetch(`${DeepSeekConfig.BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DeepSeekConfig.API_KEY}`
                },
                body: JSON.stringify({
                    model: DeepSeekConfig.MODEL,
                    messages: [
                        {
                            role: 'system',
                            content: `You are an emotional AI companion. Respond to users conversationally and naturally. 
                                    After your response, analyze the emotional tone of your reply and include an emotion tag 
                                    at the end in this format: [EMOTION:emotion_name]
                                    
                                    Available emotions: happy, excited, smiling, angry, neutral
                                    
                                    Examples:
                                    - "That's amazing news! I'm so thrilled for you! [EMOTION:excited]"
                                    - "I understand how you feel, that sounds frustrating. [EMOTION:angry]"
                                    - "Hello there! How can I help you today? [EMOTION:smiling]"`
                        },
                        ...conversationHistory,
                        {
                            role: 'user',
                            content: message
                        }
                    ],
                    max_tokens: DeepSeekConfig.MAX_TOKENS,
                    temperature: DeepSeekConfig.TEMPERATURE,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`DeepSeek API error: ${response.status}`);
            }

            const data = await response.json();
            return this.parseResponse(data.choices[0].message.content);
            
        } catch (error) {
            console.error('DeepSeek API error:', error);
            throw error;
        }
    }

    static parseResponse(responseText) {
        // Extract emotion tag from response
        const emotionRegex = /\[EMOTION:(\w+)\]/;
        const match = responseText.match(emotionRegex);
        
        let emotion = 'neutral';
        let cleanText = responseText;

        if (match) {
            emotion = match[1].toLowerCase();
            cleanText = responseText.replace(emotionRegex, '').trim();
        }

        // Map to available emotions
        const mappedEmotion = DeepSeekConfig.EMOTION_MAP[emotion] || DeepSeekConfig.EMOTION_MAP.default;

        return {
            text: cleanText,
            emotion: mappedEmotion,
            rawEmotion: emotion
        };
    }
}