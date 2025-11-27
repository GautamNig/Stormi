import React from 'react';
import useFacialExpression from '../hooks/useFacialExpression';

export default function RiveDebug() {
    const { availableInputs, currentExpression, riveLoaded, setExpression } = useFacialExpression();

    if (!riveLoaded) {
        return <div>Loading Rive debug...</div>;
    }

    const testExpressions = [
        'neutral', 'smiling', 'excited', 'happy', 'angry',
        'head1', 'head2', 'head3', 'head4', 'head5'
    ];

    return (
        <div style={{
            position: 'fixed',
            top: '70px',
            right: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            zIndex: 10000,
            fontSize: '12px',
            maxWidth: '300px'
        }}>
            <h4>Rive Debug - Numeric Inputs</h4>
            <div><strong>Current Expression:</strong> {currentExpression}</div>
            <div><strong>Available Inputs:</strong></div>
            {availableInputs.map((input, index) => (
                <div key={index} style={{ marginLeft: '10px' }}>
                    {input.name} (type: {input.type}, value: {input.value})
                </div>
            ))}
            <div style={{ marginTop: '10px' }}>
                <strong>Test Expressions:</strong>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '5px' }}>
                    {testExpressions.map(expr => (
                        <button 
                            key={expr}
                            onClick={() => setExpression(expr)}
                            style={{ 
                                padding: '2px 5px', 
                                fontSize: '10px',
                                background: currentExpression === expr ? '#4CAF50' : '#666'
                            }}
                        >
                            {expr}
                        </button>
                    ))}
                </div>
            </div>
            <div style={{ marginTop: '10px', fontSize: '10px', color: '#ccc' }}>
                <strong>Mapping:</strong><br/>
                Expression: 0=neutral, 1=smiling, 2=excited, 3=happy, 4=angry<br/>
                Pressing: 1-5=head positions
            </div>
        </div>
    );
}