// hooks/useTextToSpeech.js (improved)
import { useState, useEffect, useRef } from 'react';

export function useTextToSpeech() {
    const [isMuted, setIsMuted] = useState(false);
    const [isAvailable, setIsAvailable] = useState(false);
    const [voices, setVoices] = useState([]);
    const speechSynthesisRef = useRef(null);
    const currentUtteranceRef = useRef(null);

    useEffect(() => {
        // Check if browser supports speech synthesis
        if ('speechSynthesis' in window) {
            speechSynthesisRef.current = window.speechSynthesis;
            setIsAvailable(true);
            
            // Load available voices
            const loadVoices = () => {
                const availableVoices = speechSynthesisRef.current.getVoices();
                setVoices(availableVoices);
                console.log('🎙️ Available voices:', availableVoices);
            };
            
            speechSynthesisRef.current.onvoiceschanged = loadVoices;
            loadVoices(); // Initial load
        } else {
            console.warn('❌ Speech synthesis not supported in this browser');
        }

        return () => {
            // Cleanup on unmount
            stopSpeaking();
        };
    }, []);

    // Check if text is primarily English and speakable
    const isSpeakableText = (text) => {
    if (!text || typeof text !== 'string') {
        console.log('🔇 TTS: No text provided');
        return false;
    }
    
    const cleanText = text.replace(/\[EMOTION:\w+\]/g, '').trim();
    if (!cleanText) {
        console.log('🔇 TTS: Text is empty after cleaning');
        return false;
    }
    
    // More permissive English detection - allow common punctuation and symbols
    const englishRegex = /^[a-zA-Z0-9\s.,!?'"()\-:;@#$%^&*+=–—/\\]+$/;
    const isEnglish = englishRegex.test(cleanText);
    
    const isLongEnough = cleanText.length >= 3;
    
    console.log(`🔊 TTS Check: "${cleanText}" - English: ${isEnglish}, LongEnough: ${isLongEnough}`);
    
    // If regex fails, try a more lenient approach - check if majority is English
    if (!isEnglish) {
        const englishCharCount = (cleanText.match(/[a-zA-Z0-9\s.,!?'"()\-:;]/g) || []).length;
        const totalCharCount = cleanText.length;
        const englishRatio = englishCharCount / totalCharCount;
        const isMostlyEnglish = englishRatio > 0.3; // 30% English characters
        
        console.log(`🔊 Fallback check: ${englishCharCount}/${totalCharCount} English chars, ratio: ${englishRatio.toFixed(2)}`);
        
        return isMostlyEnglish && isLongEnough;
    }
    
    return isEnglish && isLongEnough;
};

    // Get the best available female voice
    const getFemaleVoice = () => {
        if (!voices.length) return null;
        
        // Prefer female voices, fallback to any available voice
        const femaleVoices = voices.filter(voice => 
            voice.name.toLowerCase().includes('female') || 
            voice.name.toLowerCase().includes('woman') ||
            voice.name.toLowerCase().includes('samantha') || // Common female voice name
            voice.name.toLowerCase().includes('karen') || // Common female voice name
            voice.name.toLowerCase().includes('victoria') // Common female voice name
        );
        
        // Return first female voice, or first available voice if no female voices
        return femaleVoices[0] || voices[0];
    };

    const speakText = (text) => {
        if (!isAvailable || isMuted || !speechSynthesisRef.current) {
            console.log('🔇 TTS skipped - muted or not available');
            return;
        }

        if (!isSpeakableText(text)) {
            console.log('🔇 TTS skipped - text not speakable:', text);
            return;
        }

        // Stop any current speech before starting new one
        stopSpeaking();

        try {
            const cleanText = text.replace(/\[EMOTION:\w+\]/g, '').trim();
            const utterance = new SpeechSynthesisUtterance(cleanText);
            
            // Configure voice
            const voice = getFemaleVoice();
            if (voice) {
                utterance.voice = voice;
                console.log('🎙️ Using voice:', voice.name);
            }
            
            // Configure speech properties
            utterance.rate = 0.9; // Slightly slower for natural feel
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            // Event handlers
            utterance.onstart = () => {
                console.log('🎙️ TTS started:', cleanText);
            };
            
            utterance.onend = () => {
                console.log('🎙️ TTS ended');
                currentUtteranceRef.current = null;
            };
            
            utterance.onerror = (event) => {
                console.error('🎙️ TTS error:', event.error);
                currentUtteranceRef.current = null;
            };
            
            currentUtteranceRef.current = utterance;
            speechSynthesisRef.current.speak(utterance);
            
        } catch (error) {
            console.error('🎙️ TTS error:', error);
        }
    };

    const stopSpeaking = () => {
        if (speechSynthesisRef.current) {
            speechSynthesisRef.current.cancel();
            currentUtteranceRef.current = null;
            console.log('🎙️ TTS stopped');
        }
    };

    const toggleMute = () => {
        if (!isMuted) {
            stopSpeaking(); // Stop current speech when muting
        }
        setIsMuted(!isMuted);
    };

    return {
        isAvailable,
        isMuted,
        toggleMute,
        speakText,
        stopSpeaking,
        isSpeakableText
    };
}

export default useTextToSpeech;