import { useState, useEffect, useRef } from 'react';
import { useRive } from '@rive-app/react-webgl2';

export default function useFacialExpression() {
    const [currentExpression, setCurrentExpression] = useState('neutral');
    const [riveLoaded, setRiveLoaded] = useState(false);
    const [availableInputs, setAvailableInputs] = useState([]);
    const expressionQueue = useRef([]);

    const { RiveComponent, rive } = useRive({
        src: `${import.meta.env.BASE_URL}rive/21685-40697-girl-gfacial-expression.riv`,
        autoplay: true,
        stateMachines: ["State Machine 1"],
        onLoad: () => {
            console.log('✅ Rive facial expression animation loaded');
            setRiveLoaded(true);
            // Process any queued expressions
            processExpressionQueue();
        },
        onLoadError: (error) => {
            console.error('❌ Error loading facial expression animation:', error);
            setRiveLoaded(true);
        },
    });

    useEffect(() => {
  console.log('🔄 useFacialExpression - Rive loaded:', riveLoaded, 'Rive instance:', !!rive);
}, [riveLoaded, rive]);

    // Get and log all available inputs when Rive loads
    useEffect(() => {
        if (rive && riveLoaded) {
            try {
                const inputs = rive.stateMachineInputs("State Machine 1");
                console.log('🎮 ALL AVAILABLE RIVE INPUTS:', inputs);
                
                if (inputs && inputs.length > 0) {
                    setAvailableInputs(inputs);
                }
                
                // Set initial neutral expression
                setExpressionInternal('neutral');
            } catch (error) {
                console.error('❌ Error getting Rive inputs:', error);
            }
        }
    }, [rive, riveLoaded]);

    // Process queued expressions when Rive loads
    const processExpressionQueue = () => {
        if (riveLoaded && rive && expressionQueue.current.length > 0) {
            console.log('🔄 Processing expression queue:', expressionQueue.current);
            expressionQueue.current.forEach(expression => {
                setExpressionInternal(expression);
            });
            expressionQueue.current = [];
        }
    };

    // CORRECT MAPPING BASED ON TESTING:
    const getExpressionMapping = () => {
        return {
            'neutral': { expressionValue: 0, pressingValue: 0 },
            'angry': { expressionValue: 1, pressingValue: 0 },
            'happy': { expressionValue: 2, pressingValue: 0 },
            'excited': { expressionValue: 3, pressingValue: 0 },
            'smiling': { expressionValue: 4, pressingValue: 0 }
        };
    };

    // Set expression internally (when Rive is loaded)
    const setExpressionInternal = (expression) => {
        if (!rive) {
            console.warn('❌ Rive instance not available');
            return false;
        }

        try {
            const inputs = rive.stateMachineInputs("State Machine 1");
            
            if (inputs && inputs.length >= 2) {
                const expressionMap = getExpressionMapping();
                const mapping = expressionMap[expression];
                
                console.log('🎯 Setting expression:', expression, '-> Mapping:', mapping);
                
                if (mapping) {
                    // Find the "Expression" and "Pressing" inputs
                    const expressionInput = inputs.find(inp => inp.name === 'Expression');
                    const pressingInput = inputs.find(inp => inp.name === 'Pressing');
                    
                    if (expressionInput && pressingInput) {
                        // Set the numeric values
                        expressionInput.value = mapping.expressionValue;
                        pressingInput.value = mapping.pressingValue;
                        
                        setCurrentExpression(expression);
                        console.log('🎭 Expression set successfully:', expression, 
                                   `(Expression: ${mapping.expressionValue}, Pressing: ${mapping.pressingValue})`);
                        return true;
                    } else {
                        console.warn('❌ Required inputs not found');
                    }
                } else {
                    console.warn('❌ No mapping found for expression:', expression);
                }
            } else {
                console.warn('❌ Not enough inputs found in state machine');
            }
        } catch (error) {
            console.error('❌ Error setting expression:', error);
        }
        
        return false;
    };

    // Public setExpression function
    const setExpression = (expression) => {
        console.log('🎭 Requesting expression:', expression, '| Rive loaded:', riveLoaded, '| Rive instance:', !!rive);
        
        if (!riveLoaded || !rive) {
            console.log('⏳ Rive not ready, queuing expression:', expression);
            expressionQueue.current.push(expression);
            return false;
        }

        return setExpressionInternal(expression);
    };

    // Process queue when Rive becomes available
    useEffect(() => {
        if (riveLoaded && rive) {
            processExpressionQueue();
        }
    }, [riveLoaded, rive]);

    return {
        RiveComponent,
        rive,
        currentExpression,
        riveLoaded,
        setExpression,
        availableInputs,
        isSettingExpression: false
    };
}