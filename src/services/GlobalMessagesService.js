// services/GlobalMessagesService.js
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  writeBatch, 
  increment, 
  updateDoc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  where 
} from 'firebase/firestore';

// Import from the correct location - services is in src, firebase.js is in src
// So we need to go up one directory level from services
import { db } from '../firebase'; 
export class GlobalMessagesService {
  static MESSAGES_PER_PAGE = 20;
  
  // Copy user messages to global collection (run once manually or on first visit)
  static async migrateUserMessagesToGlobal(userId, userData) {
    try {
      const userMessagesRef = collection(db, 'users', userId, 'messages');
      const messagesSnapshot = await getDocs(userMessagesRef);
      const batch = writeBatch(db);
      let migratedCount = 0;
      
      messagesSnapshot.docs.forEach((msgDoc) => {
        const msgData = msgDoc.data();
        const globalMsgRef = doc(collection(db, 'messages_global'), msgDoc.id);
        
        const globalMessage = {
          text: msgData.text || '',
          userId: userId,
          userName: userData.displayName || userData.email?.split('@')[0] || 'Anonymous',
          userAvatar: userData.photoURL || '',
          emotion: msgData.emotion || 'neutral',
          timestamp: msgData.timestamp || serverTimestamp(),
          likes: 0,
          dislikes: 0,
          score: 0,
          userVotes: {}, // Empty object
          originalMessageId: msgDoc.id,
          originalUserId: userId,
          migratedAt: serverTimestamp()
        };
        
        batch.set(globalMsgRef, globalMessage);
        migratedCount++;
      });
      
      // Update user points doc
      const userPointsRef = doc(db, 'user_points', userId);
      const userPointsData = {
        userId: userId,
        userName: userData.displayName || userData.email?.split('@')[0] || 'Anonymous',
        userAvatar: userData.photoURL || '',
        totalPoints: 0,
        totalLikes: 0,
        totalMessages: migratedCount,
        lastUpdated: serverTimestamp()
      };
      
      batch.set(userPointsRef, userPointsData);
      
      await batch.commit();
      return { success: true, migratedCount };
      
    } catch (error) {
      console.error('Migration error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Get messages with pagination
  static async getMessages(sortBy = 'hot', lastVisible = null) {
    try {
      let messagesQuery;
      const messagesRef = collection(db, 'messages_global');
      
      // Create indexes in Firebase Console for these queries:
      // 1. messages_global/score/desc,timestamp/desc
      // 2. messages_global/timestamp/desc
      
      if (sortBy === 'hot') {
        messagesQuery = query(
          messagesRef,
          orderBy('score', 'desc'),
          orderBy('timestamp', 'desc'),
          limit(this.MESSAGES_PER_PAGE)
        );
      } else {
        messagesQuery = query(
          messagesRef,
          orderBy('timestamp', 'desc'),
          limit(this.MESSAGES_PER_PAGE)
        );
      }
      
      // Apply pagination
      if (lastVisible) {
        messagesQuery = query(messagesQuery, startAfter(lastVisible));
      }
      
      const snapshot = await getDocs(messagesQuery);
      const messages = [];
      let lastDoc = null;
      
      snapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      if (snapshot.docs.length > 0) {
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
      }
      
      return { messages, lastDoc };
      
    } catch (error) {
      console.error('Error getting messages:', error);
      // Fallback to timestamp if hot sort fails (index might not be ready)
      if (error.code === 'failed-precondition' && sortBy === 'hot') {
        console.log('Hot sort index not ready, falling back to recent');
        return this.getMessages('recent', lastVisible);
      }
      throw error;
    }
  }
  
  // Vote on a message
  static async voteMessage(messageId, userId, voteType) {
    try {
      const messageRef = doc(db, 'messages_global', messageId);
      const messageSnap = await getDoc(messageRef);
      
      if (!messageSnap.exists()) {
        throw new Error('Message not found');
      }
      
      const messageData = messageSnap.data();
      const currentVotes = messageData.userVotes || {};
      const currentUserVote = currentVotes[userId];
      
      let updates = {};
      let pointsChange = 0;
      
      // Determine the new vote state
      if (currentUserVote === voteType) {
        // Undo vote: remove the vote
        updates[`userVotes.${userId}`] = null;
        updates[voteType === 'like' ? 'likes' : 'dislikes'] = increment(-1);
        updates.score = increment(voteType === 'like' ? -1 : 1);
        pointsChange = voteType === 'like' ? -1 : 0; // Dislikes don't affect points
        
      } else if (currentUserVote) {
        // Switch vote type
        // Remove old vote
        updates[`userVotes.${userId}`] = voteType;
        updates[currentUserVote === 'like' ? 'likes' : 'dislikes'] = increment(-1);
        updates[voteType === 'like' ? 'likes' : 'dislikes'] = increment(1);
        updates.score = increment(voteType === 'like' ? 2 : -2);
        pointsChange = voteType === 'like' ? 2 : -1; // Switching from dislike to like = +2 points
        
      } else {
        // New vote
        updates[`userVotes.${userId}`] = voteType;
        updates[voteType === 'like' ? 'likes' : 'dislikes'] = increment(1);
        updates.score = increment(voteType === 'like' ? 1 : -1);
        pointsChange = voteType === 'like' ? 1 : 0; // Dislikes don't affect points
      }
      
      // Update message
      await updateDoc(messageRef, updates);
      
      // Update user points if likes changed
      if (pointsChange !== 0 && messageData.userId) {
        const userPointsRef = doc(db, 'user_points', messageData.userId);
        await updateDoc(userPointsRef, {
          totalPoints: increment(pointsChange),
          totalLikes: increment(voteType === 'like' ? (currentUserVote ? 0 : 1) : 0)
        });
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('Vote error:', error);
      throw error;
    }
  }
  
  // Add new message to global feed (when user sends new message)
  static async addToGlobalFeed(messageData, userData) {
    try {
      const newMessageRef = doc(collection(db, 'messages_global'));
      
      const globalMessage = {
        ...messageData,
        userName: userData.displayName || userData.email?.split('@')[0] || 'Anonymous',
        userAvatar: userData.photoURL || '',
        likes: 0,
        dislikes: 0,
        score: 0,
        userVotes: {},
        timestamp: serverTimestamp()
      };
      
      await setDoc(newMessageRef, globalMessage);
      
      // Update user points for message count
      const userPointsRef = doc(db, 'user_points', userData.uid);
      const userPointsSnap = await getDoc(userPointsRef);
      
      if (userPointsSnap.exists()) {
        await updateDoc(userPointsRef, {
          totalMessages: increment(1)
        });
      } else {
        await setDoc(userPointsRef, {
          userId: userData.uid,
          userName: userData.displayName || userData.email?.split('@')[0] || 'Anonymous',
          userAvatar: userData.photoURL || '',
          totalPoints: 0,
          totalLikes: 0,
          totalMessages: 1,
          lastUpdated: serverTimestamp()
        });
      }
      
      return { success: true, messageId: newMessageRef.id };
      
    } catch (error) {
      console.error('Error adding to global feed:', error);
      throw error;
    }
  }
  
  // Get user points
  static async getUserPoints(userId) {
    try {
      const userPointsRef = doc(db, 'user_points', userId);
      const userPointsSnap = await getDoc(userPointsRef);
      
      if (userPointsSnap.exists()) {
        return userPointsSnap.data();
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user points:', error);
      return null;
    }
  }
  
  // Check if migration is needed for user
  static async checkMigrationNeeded(userId) {
    try {
      // Check if user has any messages not in global feed
      const userMessagesRef = collection(db, 'users', userId, 'messages');
      const globalMessagesRef = collection(db, 'messages_global');
      
      const [userMessagesSnap, userGlobalSnap] = await Promise.all([
        getDocs(query(userMessagesRef, limit(1))),
        getDocs(query(globalMessagesRef, where('userId', '==', userId), limit(1)))
      ]);
      
      // If user has messages but none in global feed, migration needed
      return userMessagesSnap.docs.length > 0 && userGlobalSnap.docs.length === 0;
      
    } catch (error) {
      console.error('Migration check error:', error);
      return false;
    }
  }

 static async getTopUsers(limitCount = 10) { // Changed parameter name to avoid conflict
  try {
    const userPointsRef = collection(db, 'user_points');
    const q = query(
      userPointsRef,
      orderBy('totalPoints', 'desc'),
      limit(limitCount) // Use limitCount instead of limit
    );
    
    const snapshot = await getDocs(q);
    const users = [];
    
    snapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return users;
  } catch (error) {
    console.error('Error getting top users:', error);
    if (error.code === 'failed-precondition') {
      console.log('Leaderboard index not ready yet');
      return [];
    }
    throw error;
  }
}

// Add index checker function
static async checkIndexes() {
  const indexesNeeded = [
    {
      collection: 'messages_global',
      fields: ['score', 'desc', 'timestamp', 'desc']
    },
    {
      collection: 'messages_global',
      fields: ['timestamp', 'desc']
    },
    {
      collection: 'user_points',
      fields: ['totalPoints', 'desc']
    }
  ];
  
  const missingIndexes = [];
  
  for (const index of indexesNeeded) {
    try {
      // Try a query that would use the index
      const testQuery = query(
        collection(db, index.collection),
        orderBy(index.fields[0], index.fields[1] || 'desc')
      );
      
      if (index.fields.length > 2) {
        // Composite index
        const testQuery2 = query(
          collection(db, index.collection),
          orderBy(index.fields[0], index.fields[1]),
          orderBy(index.fields[2], index.fields[3])
        );
        await getDocs(query(testQuery2, limit(1)));
      } else {
        await getDocs(query(testQuery, limit(1)));
      }
    } catch (error) {
      if (error.code === 'failed-precondition') {
        missingIndexes.push({
          collection: index.collection,
          fields: index.fields.join(', ')
        });
      }
    }
  }
  
  return missingIndexes;
}
}