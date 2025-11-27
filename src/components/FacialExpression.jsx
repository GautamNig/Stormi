import React from 'react';
import './FacialExpression.css';

export default function FacialExpression({ 
  RiveComponent, 
  currentExpression, 
  riveLoaded, 
  setExpression 
}) {
  console.log('🎭 FacialExpression - Props received:', { currentExpression, riveLoaded });

  return (
    <div className="facial-expression-container">
      {/* Rive Animation Only - No Controls */}
      <div className="rive-container">
        <RiveComponent 
          className="facial-expression-animation"
        />
        
        {!riveLoaded && (
          <div className="animation-loading">
            Loading facial expressions...
          </div>
        )}
      </div>
      
      {/* Control Panel Removed */}
    </div>
  );
}