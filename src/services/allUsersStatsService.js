// services/allUsersStatsService.js
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export class AllUsersStatsService {
    static async getAllUsersStatistics() {
        try {
            console.log('📊 Fetching all users statistics...');
            
            const querySnapshot = await getDocs(collection(db, 'chatMessages'));
            const messages = [];
            
            querySnapshot.forEach((doc) => {
                messages.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log('📄 Total messages found:', messages.length);

            // Group messages by user
            const usersMap = new Map();

            messages.forEach(message => {
                const userId = message.userId;
                if (!usersMap.has(userId)) {
                    usersMap.set(userId, {
                        userId: userId,
                        userName: message.userName || message.userEmail || 'Unknown User',
                        userEmail: message.userEmail,
                        messages: [],
                        totalMessages: 0,
                        emotionCounts: {
                            'happy': 0,
                            'angry': 0,
                            'neutral': 0,
                            'excited': 0,
                            'smiling': 0,
                            'total': 0
                        }
                    });
                }

                const userData = usersMap.get(userId);
                userData.messages.push(message);
                userData.totalMessages++;
                
                if (userData.emotionCounts.hasOwnProperty(message.emotion)) {
                    userData.emotionCounts[message.emotion]++;
                    userData.emotionCounts.total++;
                }
            });

            // Calculate percentages and prepare final data
            const usersStatistics = Array.from(usersMap.values()).map(user => {
                const percentages = {};
                
                Object.keys(user.emotionCounts).forEach(emotion => {
                    if (emotion !== 'total' && user.emotionCounts.total > 0) {
                        percentages[emotion] = Math.round((user.emotionCounts[emotion] / user.emotionCounts.total) * 100);
                    } else {
                        percentages[emotion] = 0;
                    }
                });

                return {
                    ...user,
                    percentages: percentages,
                    lastActivity: user.messages.length > 0 ? 
                        new Date(Math.max(...user.messages.map(m => new Date(m.timestamp)))) : 
                        null
                };
            });

            // Sort by total messages (descending)
            usersStatistics.sort((a, b) => b.totalMessages - a.totalMessages);

            console.log('📊 Users statistics calculated:', usersStatistics);
            return usersStatistics;

        } catch (error) {
            console.error('❌ Error fetching all users statistics:', error);
            throw error;
        }
    }

    static getEmotionColor(emotion) {
        const colors = {
            'happy': '#4CAF50',
            'angry': '#F44336',
            'neutral': '#9E9E9E',
            'excited': '#FF9800',
            'smiling': '#2196F3'
        };
        return colors[emotion] || '#9E9E9E';
    }

    static getEmotionIcon(emotion) {
        const icons = {
            'happy': '😄',
            'angry': '😠',
            'neutral': '😐',
            'excited': '🎉',
            'smiling': '😊'
        };
        return icons[emotion] || '🤖';
    }
}