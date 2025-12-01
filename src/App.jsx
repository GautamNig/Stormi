// App.jsx (updated)
import React, { useState } from 'react';
import Header from './components/Header';
import FacialExpression from './components/FacialExpression';
import ChatInput from './components/ChatInput';
import AIChatTooltip from './components/AIChatTooltip';
import { useAuth } from './hooks/useAuth';
import useChatMessages from './hooks/useChatMessages';
import useFacialExpression from './hooks/useFacialExpression';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import './App.css';
import UserStatistics from './components/UserStatistics';
import AllUsersStatistics from './components/AllUsersStatistics';
import AnimationAttribution from './components/AnimationAttribution';
import Leaderboard from './components/Leaderboard';
import IndexHelper from './components/IndexHelper';
import GlobalMessagesTab from './components/GlobalMessagesTab';
import { MessageService } from './services/MessageService';

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

    // Move TTS hook to App level - single instance
    const { isAvailable, isMuted, toggleMute, speakText, stopSpeaking, isSpeakableText } = useTextToSpeech();

    const [activeTab, setActiveTab] = useState('chat');

    console.log('🔄 App - Rive loaded:', riveLoaded, 'Current expression:', currentExpression);

   const handleSendMessage = async (message) => {
    if (!user) {
        alert('Please sign in to chat with the AI companion!');
        return;
    }

    try {
        // Use the original addChatMessage from your hook
        const aiResponse = await addChatMessage(message, user);
        
        console.log('🔄 Animating facial expression:', aiResponse.emotion);
        console.log('📊 Rive loaded status:', riveLoaded);
        
        if (aiResponse && aiResponse.emotion && riveLoaded) {
            setExpression(aiResponse.emotion);
            console.log('✅ Expression set:', aiResponse.emotion);
        } else {
            console.log('❌ Cannot set expression - Rive not loaded or no emotion');
        }
        
        return aiResponse;
        
    } catch (error) {
        console.error('Error in chat flow:', error);
        throw error;
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

            {/* TTS Controls */}
            {isAvailable && (
                <div className="tts-controls">
                    <button
                        className={`tts-toggle ${isMuted ? 'muted' : ''}`}
                        onClick={toggleMute}
                        title={isMuted ? 'Unmute voice' : 'Mute voice'}
                    >
                        {isMuted ? '🔇 Voice Muted' : '🔊 Voice On'}
                    </button>
                </div>
            )}

            {/* Tab Navigation */}
            {user && (
  <div className="tab-navigation">
    <button 
      className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
      onClick={() => setActiveTab('chat')}
    >
      💬 Chat
    </button>
    <button 
      className={`tab-button ${activeTab === 'global-messages' ? 'active' : ''}`}
      onClick={() => setActiveTab('global-messages')}
    >
      🌍 Global Feed
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
    <div className="chat-section">
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
      {/* Add leaderboard to chat section */}
      <div className="leaderboard-section">
        <Leaderboard />
      </div>
    </div>
  )}
  
  {activeTab === 'global-messages' && (
    <div className="global-messages-section">
      <GlobalMessagesTab />
    </div>
  )}
  
  {activeTab === 'all-stats' && (
    <div className="all-stats-section">
      <AllUsersStatistics />
    </div>
  )}
</main>

            <IndexHelper />

            {/* AI Chat Tooltips - Pass TTS functions as props */}
            {activeTab === 'chat' && chatMessages.map(message => (
                <AIChatTooltip
                    key={message.id}
                    message={message}
                    onExpire={handleTooltipExpire}
                    speakText={speakText}
                    stopSpeaking={stopSpeaking}
                    isSpeakableText={isSpeakableText}
                    isMuted={isMuted}
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