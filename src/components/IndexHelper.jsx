// components/IndexHelper.jsx
import React, { useState, useEffect } from 'react';
import { GlobalMessagesService } from '../services/GlobalMessagesService';
import './IndexHelper.css';

export default function IndexHelper() {
  const [missingIndexes, setMissingIndexes] = useState([]);
  const [checking, setChecking] = useState(false);
  const [showHelper, setShowHelper] = useState(false);

  useEffect(() => {
    checkIndexes();
  }, []);

  const checkIndexes = async () => {
    setChecking(true);
    try {
      const missing = await GlobalMessagesService.checkIndexes();
      setMissingIndexes(missing);
      setShowHelper(missing.length > 0);
    } catch (error) {
      console.error('Error checking indexes:', error);
    } finally {
      setChecking(false);
    }
  };

  if (!showHelper || missingIndexes.length === 0) {
    return null;
  }

  return (
    <div className="index-helper">
      <div className="index-helper-content">
        <h4>⚠️ Firebase Indexes Needed</h4>
        <p>Some features may not work until indexes are created in Firebase Console.</p>
        
        <div className="index-list">
          {missingIndexes.map((index, i) => (
            <div key={i} className="index-item">
              <div className="index-collection">{index.collection}</div>
              <div className="index-fields">{index.fields}</div>
            </div>
          ))}
        </div>
        
        <div className="index-instructions">
          <p>To create indexes:</p>
          <ol>
            <li>Go to Firebase Console → Firestore → Indexes</li>
            <li>Click "Create Index" for each missing index above</li>
            <li>Index creation takes 2-5 minutes</li>
            <li>Features will work automatically once indexes are ready</li>
          </ol>
        </div>
        
        <div className="index-helper-actions">
          <button onClick={checkIndexes} disabled={checking}>
            {checking ? 'Checking...' : 'Check Again'}
          </button>
          <button onClick={() => setShowHelper(false)}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}