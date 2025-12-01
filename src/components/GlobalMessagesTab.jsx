// components/GlobalMessagesTab.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { GlobalMessagesService } from '../services/GlobalMessagesService';
import './GlobalMessagesTab.css';

export default function GlobalMessagesTab() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('hot'); // 'hot' or 'recent'
  const [hasMore, setHasMore] = useState(true);
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [migrating, setMigrating] = useState(false);
  
  const lastVisibleRef = useRef(null);
  const observerRef = useRef(null);
  const loadingRef = useRef(false);

  // Load initial messages
  useEffect(() => {
    loadInitialMessages();
  }, [sortBy]);

  // Check migration on mount
  useEffect(() => {
    if (user) {
      checkMigration();
    }
  }, [user]);

  const checkMigration = async () => {
    try {
      const needed = await GlobalMessagesService.checkMigrationNeeded(user.uid);
      setMigrationNeeded(needed);
    } catch (error) {
      console.error('Migration check failed:', error);
    }
  };

  const handleMigrate = async () => {
    if (!user || migrating) return;
    
    setMigrating(true);
    try {
      const result = await GlobalMessagesService.migrateUserMessagesToGlobal(
        user.uid,
        {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL
        }
      );
      
      if (result.success) {
        setMigrationNeeded(false);
        // Reload messages
        loadInitialMessages();
      }
    } catch (error) {
      console.error('Migration failed:', error);
      setError('Migration failed. Please try again.');
    } finally {
      setMigrating(false);
    }
  };

  const loadInitialMessages = async () => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const result = await GlobalMessagesService.getMessages(sortBy);
      setMessages(result.messages);
      lastVisibleRef.current = result.lastDoc;
      setHasMore(result.messages.length === GlobalMessagesService.MESSAGES_PER_PAGE);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const loadMoreMessages = async () => {
    if (loadingRef.current || !hasMore || !lastVisibleRef.current) return;
    
    loadingRef.current = true;
    setLoadingMore(true);
    
    try {
      const result = await GlobalMessagesService.getMessages(sortBy, lastVisibleRef.current);
      setMessages(prev => [...prev, ...result.messages]);
      lastVisibleRef.current = result.lastDoc;
      setHasMore(result.messages.length === GlobalMessagesService.MESSAGES_PER_PAGE);
    } catch (err) {
      console.error('Error loading more messages:', err);
      setError('Failed to load more messages.');
    } finally {
      setLoadingMore(false);
      loadingRef.current = false;
    }
  };

  // Infinite scroll observer
  const lastMessageRef = useCallback((node) => {
    if (loadingRef.current) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        loadMoreMessages();
      }
    });
    
    if (node) {
      observerRef.current.observe(node);
    }
  }, [hasMore, loadingMore]);

  const handleVote = async (messageId, voteType) => {
    if (!user) {
      alert('Please sign in to vote!');
      return;
    }
    
    try {
      await GlobalMessagesService.voteMessage(messageId, user.uid, voteType);
      
      // Update local state for immediate feedback
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const currentVote = msg.userVotes?.[user.uid];
          const newVotes = { ...msg.userVotes };
          
          let newLikes = msg.likes;
          let newDislikes = msg.dislikes;
          let newScore = msg.score;
          
          if (currentVote === voteType) {
            // Undo vote
            delete newVotes[user.uid];
            if (voteType === 'like') newLikes--;
            else newDislikes--;
            newScore = voteType === 'like' ? newScore - 1 : newScore + 1;
          } else if (currentVote) {
            // Switch vote
            newVotes[user.uid] = voteType;
            if (currentVote === 'like') newLikes--;
            else newDislikes--;
            if (voteType === 'like') newLikes++;
            else newDislikes++;
            newScore = voteType === 'like' ? newScore + 2 : newScore - 2;
          } else {
            // New vote
            newVotes[user.uid] = voteType;
            if (voteType === 'like') newLikes++;
            else newDislikes++;
            newScore = voteType === 'like' ? newScore + 1 : newScore - 1;
          }
          
          return {
            ...msg,
            likes: newLikes,
            dislikes: newDislikes,
            score: newScore,
            userVotes: newVotes
          };
        }
        return msg;
      }));
      
    } catch (error) {
      console.error('Vote failed:', error);
      alert('Failed to vote. Please try again.');
    }
  };

  const handleSortChange = (newSort) => {
    if (newSort !== sortBy) {
      setSortBy(newSort);
      setMessages([]);
      lastVisibleRef.current = null;
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="global-messages-loading">
        <div className="loading-spinner"></div>
        Loading messages...
      </div>
    );
  }

  return (
    <div className="global-messages-tab">
      <div className="global-messages-header">
        <h2>🌍 Global Messages Feed</h2>
        <p>See what everyone is saying. Vote on messages you like!</p>
        
        {migrationNeeded && (
          <div className="migration-notice">
            <p>Your messages need to be added to the global feed.</p>
            <button 
              onClick={handleMigrate}
              disabled={migrating}
              className="migrate-btn"
            >
              {migrating ? 'Migrating...' : 'Add My Messages to Global Feed'}
            </button>
          </div>
        )}
        
        <div className="sort-controls">
          <button 
            className={`sort-btn ${sortBy === 'hot' ? 'active' : ''}`}
            onClick={() => handleSortChange('hot')}
          >
            🔥 Hot
          </button>
          <button 
            className={`sort-btn ${sortBy === 'recent' ? 'active' : ''}`}
            onClick={() => handleSortChange('recent')}
          >
            ⏰ Recent
          </button>
        </div>
      </div>

      {error && (
        <div className="global-messages-error">
          {error}
          <button onClick={loadInitialMessages}>Retry</button>
        </div>
      )}

      <div className="messages-feed">
        {messages.map((message, index) => (
          <GlobalMessageItem
            key={message.id}
            message={message}
            currentUserId={user?.uid}
            onVote={handleVote}
            isLast={index === messages.length - 1}
            lastMessageRef={lastMessageRef}
          />
        ))}
        
        {loadingMore && (
          <div className="loading-more">
            <div className="loading-spinner small"></div>
            Loading more messages...
          </div>
        )}
        
        {!hasMore && messages.length > 0 && (
          <div className="no-more-messages">
            No more messages to load
          </div>
        )}
        
        {messages.length === 0 && !loading && (
          <div className="no-messages">
            <p>No messages yet. Be the first to start the conversation!</p>
            <p>Send a message in the chat tab to add it here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Message Item Component
function GlobalMessageItem({ message, currentUserId, onVote, isLast, lastMessageRef }) {
  const currentUserVote = message.userVotes?.[currentUserId];
  
  const getEmotionIcon = (emotion) => {
    const icons = {
      'happy': '😄',
      'angry': '😠',
      'neutral': '😐',
      'excited': '🎉',
      'smiling': '😊'
    };
    return icons[emotion] || '🤖';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      className={`global-message-item ${currentUserId === message.userId ? 'own-message' : ''}`}
      ref={isLast ? lastMessageRef : null}
    >
      <div className="message-header">
        <div className="user-info">
          <img 
            src={message.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.userName)}&background=random`}
            alt={message.userName}
            className="user-avatar"
          />
          <div className="user-details">
            <div className="user-name">{message.userName}</div>
            <div className="user-points">Points: {message.userPoints || 0}</div>
          </div>
        </div>
        <div className="message-meta">
          <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
          <span className="emotion-badge">
            {getEmotionIcon(message.emotion)} {message.emotion}
          </span>
        </div>
      </div>
      
      <div className="message-content">
        {message.text}
      </div>
      
      <div className="message-footer">
        <div className="vote-buttons">
          <button 
            className={`vote-btn like-btn ${currentUserVote === 'like' ? 'active' : ''}`}
            onClick={() => onVote(message.id, 'like')}
            title="Like this message"
          >
            👍 {message.likes || 0}
          </button>
          <button 
            className={`vote-btn dislike-btn ${currentUserVote === 'dislike' ? 'active' : ''}`}
            onClick={() => onVote(message.id, 'dislike')}
            title="Dislike this message"
          >
            👎 {message.dislikes || 0}
          </button>
          <div className="score-badge">
            Score: {message.score || 0}
          </div>
        </div>
        
        {currentUserId === message.userId && (
          <span className="own-indicator">Your message</span>
        )}
      </div>
    </div>
  );
}