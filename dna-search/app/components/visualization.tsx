import React, { useState, useEffect, useCallback } from 'react';

interface VisualizationStep {
  type: 'align' | 'compare' | 'match' | 'mismatch' | 'shift' | 'encrypt' | 'decrypt';
  textIndex?: number;
  patternIndex?: number;
  shift?: number;
  message: string;
  encryptionData?: {
    textShares: number[];
    patternShares: number[];
    textValue?: number;
    patternValue?: number;
  };
}

interface Props {
  text: string;
  pattern: string;
  isPlaying: boolean;
  onStepComplete: (step: VisualizationStep) => void;
  onComplete: (found: boolean, position?: number) => void;
  speed: number;
}

const StringMatchingVisualization: React.FC<Props> = ({
  text,
  pattern,
  isPlaying,
  onStepComplete,
  onComplete,
  speed
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [textPosition, setTextPosition] = useState(0);
  const [patternPosition, setPatternPosition] = useState(0);
  const [comparisonIndex, setComparisonIndex] = useState(-1);
  const [matchedIndices, setMatchedIndices] = useState<Set<number>>(new Set());
  const [mismatchedIndices, setMismatchedIndices] = useState<Set<number>>(new Set());
  const [encryptionShares, setEncryptionShares] = useState<{[key: number]: {text: number, pattern: number}}>({});
  const [steps, setSteps] = useState<VisualizationStep[]>([]);

  const PRIME = 257;
  const getCharCode = (char: string) => char.charCodeAt(0);
  
  const createSecretShares = (value: number) => {
    const share1 = Math.floor(Math.random() * PRIME);
    const share2 = (value - share1 + PRIME) % PRIME;
    return { share1, share2 };
  };

  const reconstructSecret = (share1: number, share2: number) => {
    return (share1 + share2) % PRIME;
  };

  const generateSteps = useCallback(() => {
    const newSteps: VisualizationStep[] = [];
    const m = pattern.length;
    const n = text.length;
    let shift = 0;

    const badCharTable: {[key: string]: number} = {};
    for (let i = 0; i < m; i++) {
      badCharTable[pattern[i]] = i;
    }

    while (shift <= n - m) {
      newSteps.push({
        type: 'align',
        shift,
        message: `Aligning pattern at position ${shift}`
      });

      let j = m - 1;
      const textShares: number[] = [];
      const patternShares: number[] = [];
      
      for (let k = 0; k < m; k++) {
        const textChar = getCharCode(text[shift + k]);
        const patternChar = getCharCode(pattern[k]);
        
        const textShareData = createSecretShares(textChar);
        const patternShareData = createSecretShares(patternChar);
        
        textShares.push(textShareData.share1);
        patternShares.push(patternShareData.share1);
      }

      newSteps.push({
        type: 'encrypt',
        message: 'Encrypting characters using SMPC secret sharing',
        encryptionData: { textShares, patternShares }
      });

      while (j >= 0) {
        const textChar = text[shift + j];
        const patternChar = pattern[j];

        newSteps.push({
          type: 'compare',
          textIndex: shift + j,
          patternIndex: j,
          message: `Comparing encrypted values at Text[${shift + j}] = '${textChar}' with Pattern[${j}] = '${patternChar}'`,
          encryptionData: {
            textShares,
            patternShares,
            textValue: getCharCode(textChar),
            patternValue: getCharCode(patternChar)
          }
        });

        if (textChar === patternChar) {
          newSteps.push({
            type: 'match',
            textIndex: shift + j,
            patternIndex: j,
            message: `Match found! '${textChar}' = '${patternChar}'`
          });
          j--;
        } else {
          newSteps.push({
            type: 'mismatch',
            textIndex: shift + j,
            patternIndex: j,
            message: `Mismatch found! '${textChar}' ≠ '${patternChar}'`
          });
          break;
        }
      }

      if (j < 0) {
        newSteps.push({
          type: 'match',
          message: `Pattern found at position ${shift}!`,
          shift
        });
        break;
      }
      else {
        const mismatchedChar = text[shift + j];
        const lastOccurrence = badCharTable[mismatchedChar] ?? -1;
        const badCharShift = Math.max(1, j - lastOccurrence);
        
        newSteps.push({
          type: 'shift',
          shift: badCharShift,
          message: `Applying bad character shift of ${badCharShift} positions`
        });
        
        shift += badCharShift;
      }
    }

    if (shift > n - m) {
      newSteps.push({
        type: 'mismatch',
        message: 'Pattern not found in text'
      });
    }

    setSteps(newSteps);
  }, [text, pattern]);

  useEffect(() => {
    generateSteps();
    setCurrentStep(0);
    setTextPosition(0);
    setPatternPosition(0);
    setComparisonIndex(-1);
    setMatchedIndices(new Set());
    setMismatchedIndices(new Set());
    setEncryptionShares({});
  }, [generateSteps]);

  useEffect(() => {
    if (!isPlaying || currentStep >= steps.length) return;

    const timer = setTimeout(() => {
      const step = steps[currentStep];
      
      switch (step.type) {
        case 'align':
          setTextPosition(step.shift || 0);
          setPatternPosition(step.shift || 0);
          setMatchedIndices(new Set());
          setMismatchedIndices(new Set());
          setComparisonIndex(-1);
          break;
          
        case 'encrypt':
          if (step.encryptionData) {
            const newShares: {[key: number]: {text: number, pattern: number}} = {};
            step.encryptionData.textShares.forEach((share, i) => {
              newShares[i] = {
                text: share,
                pattern: step.encryptionData!.patternShares[i]
              };
            });
            setEncryptionShares(newShares);
          }
          break;
          
        case 'compare':
          if (step.textIndex !== undefined && step.patternIndex !== undefined) {
            setComparisonIndex(step.patternIndex);
          }
          break;
          
        case 'match':
          if (step.textIndex !== undefined && step.patternIndex !== undefined) {
            setMatchedIndices(prev => new Set([...prev, step.patternIndex!]));
            setComparisonIndex(-1);
          }
          break;
          
        case 'mismatch':
          if (step.textIndex !== undefined && step.patternIndex !== undefined) {
            setMismatchedIndices(prev => new Set([...prev, step.patternIndex!]));
            setComparisonIndex(-1);
          }
          break;
      }

      onStepComplete(step);
      setCurrentStep(prev => prev + 1);
      
      if (currentStep === steps.length - 1) {
        const found = steps.some(s => s.type === 'match' && s.shift !== undefined);
        const position = steps.find(s => s.type === 'match' && s.shift !== undefined)?.shift;
        onComplete(found, position);
      }
    }, 1000 / speed);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, steps, speed, onStepComplete, onComplete]);

  const renderCharacter = (char: string, index: number, isPattern: boolean = false) => {
    const isComparing = comparisonIndex === index && isPattern;
    const isMatched = matchedIndices.has(index) && isPattern;
    const isMismatched = mismatchedIndices.has(index) && isPattern;
    const isEncrypted = encryptionShares[index] !== undefined;

    let className = 'char-box';
    if (isPattern) className += ' pattern-char';
    else className += ' text-char';
    if (isComparing) className += ' comparing';
    if (isMatched) className += ' matched';
    if (isMismatched) className += ' mismatched';
    if (isEncrypted) className += ' encrypted';

    return (
      <div key={`${isPattern ? 'p' : 't'}-${index}`} className={className}>
        {char}
        {isEncrypted && (
          <div style={{ fontSize: '8px', marginTop: '2px' }}>
            T:{encryptionShares[index]?.text} P:{encryptionShares[index]?.pattern}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="visualization-container">
      <h3>Boyer-Moore Algorithm with SMPC Visualization</h3>
      
      <div className="string-display">
        <div style={{ marginBottom: '1rem' }}>
          <strong>Text:</strong>
          <div className="text-row">
            {text.split('').map((char, index) => renderCharacter(char, index, false))}
          </div>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <strong>Pattern:</strong>
          <div className="pattern-row pattern-alignment" style={{ marginLeft: `${textPosition * 42}px` }}>
            {pattern.split('').map((char, index) => renderCharacter(char, index, true))}
          </div>
        </div>
      </div>

      {Object.keys(encryptionShares).length > 0 && (
        <div className="encryption-visualization">
          <div className="party-section querying-party">
            <h4>🔐 Querying Party (Pattern Shares)</h4>
            {Object.entries(encryptionShares).map(([index, shares]) => (
              <div key={`pattern-${index}`} className="share-value">
                P[{index}]: {shares.pattern}
              </div>
            ))}
          </div>
          
          <div className="party-section database-owner">
            <h4>🗄️ Database Owner (Text Shares)</h4>
            {Object.entries(encryptionShares).map(([index, shares]) => (
              <div key={`text-${index}`} className="share-value">
                T[{index}]: {shares.text}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="step-indicator">
        <h4>Current Step: {currentStep + 1} / {steps.length}</h4>
        <p>{steps[currentStep]?.message || 'Ready to start...'}</p>
      </div>
    </div>
  );
};

export default StringMatchingVisualization;