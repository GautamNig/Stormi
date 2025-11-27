export const AIConfig = {
    // OpenRouter Free DeepSeek
    OPENROUTER_API_KEY: import.meta.env.VITE_OPENROUTER_API_KEY,
    OPENROUTER_MODEL: 'deepseek/deepseek-chat',
    OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
    
    // Free rate limits
    RATE_LIMIT: {
        REQUESTS_PER_MINUTE: 5,
        COOLDOWN_MS: 12000 // 12 seconds between requests
    },
    
    // Emotion mapping
    EMOTION_MAP: {
        'happy': 'happy',
        'joy': 'happy',
        'excited': 'excited', 
        'excitement': 'excited',
        'smiling': 'smiling',
        'smile': 'smiling',
        'angry': 'angry',
        'anger': 'angry',
        'mad': 'angry',
        'frustrated': 'angry',
        'neutral': 'neutral',
        'calm': 'neutral',
        'default': 'neutral'
    }
};