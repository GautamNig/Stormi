// config/aiConfig.js (FIX Hugging Face)
export const AIConfig = {
    PROVIDERS: {
        OPENROUTER: {
            name: 'OpenRouter',
            enabled: true,
            priority: 1,
            baseUrl: 'https://openrouter.ai/api/v1',
            apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
            model: 'meta-llama/llama-3.1-8b-instruct',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Emotional AI Companion'
            }
        },
    //      TOGETHER: {
    //     name: 'Together AI',
    //     enabled: true,
    //     priority: 2,
    //     baseUrl: 'https://api.together.xyz/v1',
    //     apiKey: import.meta.env.VITE_TOGETHER_API_KEY,
    //     model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${import.meta.env.VITE_TOGETHER_API_KEY}`
    //     }
    // },
    // PERPLEXITY: {
    //     name: 'Perplexity',
    //     enabled: false, // Enable if you get API key
    //     priority: 3,
    //     baseUrl: 'https://api.perplexity.ai',
    //     apiKey: import.meta.env.VITE_PERPLEXITY_API_KEY,
    //     model: 'sonar-small-chat',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${import.meta.env.VITE_PERPLEXITY_API_KEY}`
    //     }
    // },
    HUGGINGFACE: {
        name: 'Hugging Face',
        enabled: false, // Disable until we fix CORS
        priority: 4,
        baseUrl: 'https://api-inference.huggingface.co/models',
        apiKey: import.meta.env.VITE_HUGGINGFACE_API_KEY,
        model: 'microsoft/DialoGPT-medium',
        headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json'
        }
    },
    //     DEEPSEEK: {
    //         name: 'DeepSeek',
    //         enabled: true,
    //         priority: 3,
    //         baseUrl: 'https://api.deepseek.com/v1',
    //         apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
    //         model: 'deepseek-chat',
    //         headers: {
    //             'Content-Type': 'application/json',
    //             'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`
    //         }
    //     },
    //         GROQ: {
    //     name: 'Groq',
    //     enabled: false, // Enable if you get API key
    //     priority: 4,
    //     baseUrl: 'https://api.groq.com/openai/v1',
    //     apiKey: import.meta.env.VITE_GROQ_API_KEY,
    //     model: 'llama2-70b-4096',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
    //     }
    // },
    },
    
    MAX_TOKENS: 150,
    TEMPERATURE: 0.7,
    STREAM: false,
    
    RATE_LIMIT: {
        REQUESTS_PER_MINUTE: 10
    }
};