export const DeepSeekConfig = {
    API_KEY: import.meta.env.VITE_DEEPSEEK_API_KEY,
    BASE_URL: 'https://api.deepseek.com/v1',
    MODEL: 'deepseek-chat',
    MAX_TOKENS: 500,
    TEMPERATURE: 0.7,
    
    // Emotion mapping for facial expressions
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