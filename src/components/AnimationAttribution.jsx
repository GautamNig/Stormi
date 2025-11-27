import React, { useState } from 'react';
import './AnimationAttribution.css';

export default function AnimationAttribution() {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="animation-attribution">
            <button 
                className="attribution-toggle"
                onClick={() => setIsExpanded(!isExpanded)}
                title="Animation Attribution"
            >
                ℹ️ Attribution
            </button>

            {isExpanded && (
                <div className="attribution-content">
                    <div className="attribution-header">
                        <h4>Animation Attribution</h4>
                        <button 
                            className="close-button"
                            onClick={() => setIsExpanded(false)}
                        >
                            ×
                        </button>
                    </div>
                    
                    <div className="attribution-details">
                        <div className="attribution-item">
                            <strong>Avatar:</strong> Animoox_Studio
                        </div>
                        
                        <div className="attribution-item">
                            <strong>Concept:</strong> Girl Gfacial Expression
                        </div>
                        
                        <div className="attribution-item">
                            <strong>For Hire:</strong> Available for custom projects
                        </div>
                        
                        <div className="attribution-item contact-info">
                            <strong>Email:</strong> latif.bd1789@gmail.com
                        </div>
                        
                        <div className="attribution-item contact-info">
                            <strong>Website:</strong> animoox.com
                        </div>
                        
                        <div className="attribution-item license">
                            <strong>License:</strong> CC BY
                        </div>
                        
                        <div className="attribution-item date">
                            <strong>Published:</strong> 6 July 2025
                        </div>
                        
                        <div className="attribution-note">
                            <strong>Note for animators:</strong> You can learn from this. 
                            Please don't modify it and re-publish in your portfolio.
                        </div>
                    </div>
                    
                    <div className="attribution-footer">
                        <a 
                            href="https://animoox.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="website-link"
                        >
                            Visit Animoox Studio
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}