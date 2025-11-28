// App.jsx
import React, { useState } from 'react';
import Header from './components/Header';
import FacialExpression from './components/FacialExpression';
import ChatInput from './components/ChatInput';
import AIChatTooltip from './components/AIChatTooltip';
import { useAuth } from './hooks/useAuth';
import useChatMessages from './hooks/useChatMessages';
import useFacialExpression from './hooks/useFacialExpression';
import './App.css';
import UserStatistics from './components/UserStatistics';
import AllUsersStatistics from './components/AllUsersStatistics';
import AnimationAttribution from './components/AnimationAttribution';

export default function App() {
  const { user, loading } = useAuth();
  const { 
    chatMessages, 
    isLoading, 
    addChatMessage, 
    removeChatMessage 
  } = useChatMessages();
  
  const { 
    RiveComponent, 
    currentExpression, 
    riveLoaded, 
    setExpression 
  } = useFacialExpression();

  // Add state for active tab
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'all-stats'

  console.log('🔄 App - Rive loaded:', riveLoaded, 'Current expression:', currentExpression);

  const handleSendMessage = async (message) => {
    if (!user) {
      alert('Please sign in to chat with the AI companion!');
      return;
    }

    try {
      const aiResponse = await addChatMessage(message, user);
      
      console.log('🔄 Animating facial expression:', aiResponse.emotion);
      console.log('📊 Rive loaded status:', riveLoaded);
      
      if (aiResponse && aiResponse.emotion && riveLoaded) {
        setExpression(aiResponse.emotion);
        console.log('✅ Expression set:', aiResponse.emotion);
      } else {
        console.log('❌ Cannot set expression - Rive not loaded or no emotion');
      }
      
    } catch (error) {
      console.error('Error in chat flow:', error);
    }
  };

  const handleTooltipExpire = (messageId) => {
    removeChatMessage(messageId);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading authentication...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Header />
      
      {/* Tab Navigation - ALWAYS show when user is logged in */}
      {user && (
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            💬 Chat
          </button>
          <button 
            className={`tab-button ${activeTab === 'all-stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('all-stats')}
          >
            📊 All Users Stats
          </button>
        </div>
      )}

      {/* Tab Content */}
      <main className="main-content">
        {activeTab === 'chat' && (
          user ? (
            <div className="chat-section">
              {/* UserStatistics is now INSIDE the chat section, below the animation */}
              <div className="animation-section">
                <FacialExpression 
                  RiveComponent={RiveComponent}
                  currentExpression={currentExpression}
                  riveLoaded={riveLoaded}
                  setExpression={setExpression}
                />
              </div>
              <div className="user-stats-section">
                <UserStatistics />
              </div>
            </div>
          ) : (
            <div className="landing-section">
              <div className="hero-content">
                <h1>Interactive AI Companion</h1>
                <p>Sign in to chat with an AI that responds with emotions and facial expressions!</p>
                <div className="demo-preview">
                  <FacialExpression 
                    RiveComponent={RiveComponent}
                    currentExpression={currentExpression}
                    riveLoaded={riveLoaded}
                    setExpression={setExpression}
                  />
                </div>
              </div>
            </div>
          )
        )}

        {activeTab === 'all-stats' && (
          <div className="all-stats-section">
            <AllUsersStatistics />
          </div>
        )}
      </main>

      {/* AI Chat Tooltips - Only show in chat tab */}
      {activeTab === 'chat' && chatMessages.map(message => (
        <AIChatTooltip
          key={message.id}
          message={message}
          onExpire={handleTooltipExpire}
        />
      ))}

      {/* Chat Input - Only show in chat tab */}
      {activeTab === 'chat' && (
        <ChatInput 
          onSendMessage={handleSendMessage}
          disabled={!user || isLoading}
        />
      )}

      {/* Animation Attribution - Show in all tabs */}
      <AnimationAttribution />

      {/* Loading indicator for AI responses - Only show in chat tab */}
      {activeTab === 'chat' && isLoading && (
        <div className="ai-loading-indicator">
          <div className="ai-typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span>AI is thinking...</span>
        </div>
      )}
    </div>
  );
}