import React from 'react';
import Header from './components/Header';
import './App.css';

function App() {
  return (
    <div className="App">
      <Header />
      <main className="main-content">
        {/* Your app content goes here */}
        <h1>Welcome to Your App</h1>
        <p>This is your main application content.</p>
      </main>
    </div>
  );
}

export default App;