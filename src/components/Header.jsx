import React from 'react';
import { useAuth } from '../hooks/useAuth';
import './Header.css'; // Optional: for styling

const Header = () => {
  const { user, loading, signInWithGoogle, logout } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      // Handle error (you can show a toast notification here)
      console.error('Sign in failed:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  if (loading) {
    return (
      <header className="header">
        <div className="header-content">
          <div className="logo">Stormi - Don't push my buttons.</div>
          <div>Loading...</div>
        </div>
      </header>
    );
  }

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">Stormi - Don't push my buttons.</div>
        
        <div className="auth-section">
          {user ? (
            <div className="user-info">
              <span className="user-name">
                Hello, {user.displayName || user.email}
              </span>
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="user-avatar"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={handleSignOut}
                className="sign-out-btn"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button 
              onClick={handleSignIn}
              className="sign-in-btn"
            >
              Sign In with Google
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;