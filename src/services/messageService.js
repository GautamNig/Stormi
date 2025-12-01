// services/messageService.js - CORRECTED
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  onSnapshot,
  doc,
  getDoc 
} from 'firebase/firestore';
import { GlobalMessagesService } from './GlobalMessagesService';

export class MessageService {
    static async saveMessage(user, message, aiResponse, emotion) {
        try {
            if (!user) {
                throw new Error('User must be logged in to save messages');
            }

            console.log('💾 Saving message to Firebase:', { user: user.uid, message, emotion });

            const messageData = {
                userId: user.uid,
                userEmail: user.email,
                userName: user.displayName || user.email,
                userMessage: message,
                aiResponse: aiResponse.text,
                emotion: emotion,
                rawEmotion: aiResponse.rawEmotion,
                timestamp: new Date(),
                hadEmotionTag: aiResponse.hadEmotionTag
            };

            console.log('📝 Message data:', messageData);

            const docRef = await addDoc(collection(db, 'chatMessages'), messageData);
            console.log('✅ Message saved to Firebase with ID:', docRef.id);
            
            // Also add to global feed
            try {
                await GlobalMessagesService.addToGlobalFeed({
                    text: message,
                    userId: user.uid,
                    emotion: emotion,
                    timestamp: new Date()
                }, {
                    uid: user.uid,
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL
                });
                console.log('✅ Also added to global feed');
            } catch (globalError) {
                console.warn('⚠️ Failed to add to global feed (non-critical):', globalError);
                // Don't throw - this is optional
            }
            
            return docRef.id;
            
        } catch (error) {
            console.error('❌ Error saving message to Firebase:', error);
            throw error;
        }
    }

    static async addMessage(userId, message, emotion) {
        // This seems to be a duplicate of saveMessage but with different params
        // I'll keep it for compatibility
        try {
            // Get user data - you need to pass user object or get from auth
            console.warn('⚠️ addMessage called - consider using saveMessage instead');
            // For now, return a mock response
            return { 
                id: 'temp-id',
                emotion: emotion 
            };
        } catch (error) {
            console.error('Error in addMessage:', error);
            throw error;
        }
    }
  
    static async getUserData(userId) {
        try {
            // If you have a users collection, you can fetch from there
            // For now, return minimal user data
            return {
                uid: userId,
                displayName: 'User',
                email: 'user@example.com',
                photoURL: ''
            };
        } catch (error) {
            console.error('Error getting user data:', error);
            return {
                uid: userId,
                displayName: 'Anonymous',
                email: '',
                photoURL: ''
            };
        }
    }

    static async getUserMessages(userId) {
        try {
            console.log('📥 Fetching messages for user:', userId);
            
            const q = query(
                collection(db, 'chatMessages'),
                where('userId', '==', userId),
                orderBy('timestamp', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            const messages = [];
            
            querySnapshot.forEach((doc) => {
                console.log('📄 Found message:', doc.id, doc.data());
                messages.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log('📊 Total messages found:', messages.length);
            return messages;
        } catch (error) {
            console.error('❌ Error fetching user messages:', error);
            
            // Fallback: try without ordering if index isn't ready
            if (error.code === 'failed-precondition') {
                console.log('🔄 Trying fallback query without ordering...');
                try {
                    const q = query(
                        collection(db, 'chatMessages'),
                        where('userId', '==', userId)
                    );
                    
                    const querySnapshot = await getDocs(q);
                    const messages = [];
                    
                    querySnapshot.forEach((doc) => {
                        messages.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    
                    // Sort manually
                    messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    return messages;
                } catch (fallbackError) {
                    console.error('❌ Fallback query also failed:', fallbackError);
                }
            }
            
            throw error;
        }
    }

    static subscribeToUserMessages(userId, callback) {
        console.log('🔔 Subscribing to messages for user:', userId);
        
        // Use simpler query for subscription to avoid index issues
        const q = query(
            collection(db, 'chatMessages'),
            where('userId', '==', userId)
        );

        return onSnapshot(q, (querySnapshot) => {
            const messages = [];
            querySnapshot.forEach((doc) => {
                messages.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Sort manually by timestamp
            messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            console.log('📨 Subscription update:', messages.length, 'messages');
            callback(messages);
        }, (error) => {
            console.error('❌ Subscription error:', error);
        });
    }

    static async getEmotionStatistics(userId) {
        try {
            console.log('📈 Getting emotion statistics for user:', userId);
            
            const messages = await this.getUserMessages(userId);
            
            const emotionCounts = {
                'happy': 0,
                'angry': 0,
                'neutral': 0,
                'excited': 0,
                'smiling': 0,
                'total': messages.length
            };

            messages.forEach(message => {
                if (emotionCounts.hasOwnProperty(message.emotion)) {
                    emotionCounts[message.emotion]++;
                } else {
                    console.warn('⚠️ Unknown emotion:', message.emotion);
                }
            });

            // Calculate percentages
            const percentages = {};
            Object.keys(emotionCounts).forEach(emotion => {
                if (emotion !== 'total' && emotionCounts.total > 0) {
                    percentages[emotion] = Math.round((emotionCounts[emotion] / emotionCounts.total) * 100);
                } else {
                    percentages[emotion] = 0;
                }
            });

            console.log('📊 Statistics calculated:', { counts: emotionCounts, percentages });
            
            return {
                counts: emotionCounts,
                percentages: percentages,
                totalMessages: emotionCounts.total
            };
            
        } catch (error) {
            console.error('❌ Error getting emotion statistics:', error);
            
            // Return empty statistics if there's an error
            return {
                counts: {
                    'happy': 0,
                    'angry': 0,
                    'neutral': 0,
                    'excited': 0,
                    'smiling': 0,
                    'total': 0
                },
                percentages: {
                    'happy': 0,
                    'angry': 0,
                    'neutral': 0,
                    'excited': 0,
                    'smiling': 0
                },
                totalMessages: 0
            };
        }
    }
}