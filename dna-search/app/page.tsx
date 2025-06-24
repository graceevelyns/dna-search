'use client';

import { useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';

const StringMatchingVisualization = dynamic(
  () => import('./components/visualization'),
  { ssr: false }
);

interface LogEntry {
  party: string;
  type: string;
  message: string;
  timestamp?: number;
  cryptoData?: {
    shares?: number[];
    operation?: string;
    securityLevel?: string;
  };
}

interface SearchResult {
  found: boolean;
  message: string;
  position?: number;
}

interface ApiResponse {
  result: SearchResult;
  log: LogEntry[];
  stats?: {
    totalEncryptionRounds: number;
    totalComparisons: number;
    securityLevel: string;
    protocolCompliance: string;
  };
  visualizationData?: any[];
}

export default function Home() {
  const [text, setText] = useState('ACGTACGTACGTACGTACGTACGTACGTACGTACGT');
  const [pattern, setPattern] = useState('ACGTACGT');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<ApiResponse['stats'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [currentStep, setCurrentStep] = useState<any>(null);

  const handleSearch = async () => {
    setIsLoading(true);
    setResult(null);
    setLog([]);
    setStats(null);
    setShowVisualization(false);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, pattern }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      setResult(data.result);
      setLog(data.log);
      setStats(data.stats);
    }
    catch (error: any) {
      console.error("API call failed:", error);
      setResult({ found: false, message: "An error occurred during the secure search." });
      setLog([]);
    }
    finally {
      setIsLoading(false);
    }
  };

  const startVisualization = () => {
    setShowVisualization(true);
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const resetVisualization = () => {
    setIsPlaying(false);
    setShowVisualization(false);
    setCurrentStep(null);
  };

  const handleStepComplete = (step: any) => {
    setCurrentStep(step);
  };

  const handleVisualizationComplete = (found: boolean, position?: number) => {
    setIsPlaying(false);
    console.log(`Visualization complete: ${found ? `Found at ${position}` : 'Not found'}`);
  };

  return (
    <div className="container">
      <Head>
        <title>Privacy-Preserving DNA Search with SMPC</title>
        <meta name="description" content="Demonstration of Boyer-Moore algorithm using SMPC with real-time visualization" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">
          🧬 Privacy-Preserving DNA Sequence Matching
        </h1>

        <p className="description">
          This application demonstrates a Boyer-Moore pattern matching algorithm using Secure Multi-Party Computation (SMPC) with real-time visualization. 
          Three parties collaborate to find DNA patterns while maintaining complete privacy and security.
        </p>

        <div className="grid">
          <div className="card full-width">
            <h3>🔬 DNA Input Data</h3>
            <label htmlFor="text-input">DNA Database (Text)</label>
            <textarea
              id="text-input"
              value={text}
              onChange={(e) => setText(e.target.value.toUpperCase().replace(/[^ACGT]/g, ''))}
              placeholder="Enter the full DNA sequence (e.g., ACGTACGTACGT...)"
              rows={5}
            />
            <label htmlFor="pattern-input">DNA Query Pattern</label>
            <input
              id="pattern-input"
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value.toUpperCase().replace(/[^ACGT]/g, ''))}
              placeholder="Enter the pattern to search for (e.g., ACGT)"
            />
            
            <div className="controls">
              <button onClick={handleSearch} disabled={isLoading} className="search-btn">
                {isLoading ? '🔒 Encrypting & Searching...' : '🚀 Perform Secure SMPC Search'}
              </button>
              
              {result && !showVisualization && (
                <button onClick={startVisualization} className="visualize-btn">
                  🎬 Start Live Visualization
                </button>
              )}
            </div>
          </div>

          {showVisualization && (
            <div className="card full-width">
              <div className="controls">
                <button onClick={togglePlayPause} className={isPlaying ? "pause-btn" : "play-btn"}>
                  {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                </button>
                <button onClick={resetVisualization} className="reset-btn">
                  🔄 Reset
                </button>
                
                <div className="speed-control">
                  <label>Animation Speed:</label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.5"
                    value={animationSpeed}
                    onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                  />
                  <span>{animationSpeed}x</span>
                </div>
              </div>

              <StringMatchingVisualization
                text={text}
                pattern={pattern}
                isPlaying={isPlaying}
                onStepComplete={handleStepComplete}
                onComplete={handleVisualizationComplete}
                speed={animationSpeed}
              />
            </div>
          )}

          {result && (
            <div className={`card full-width result-card ${result.found ? 'success' : 'failure'}`}>
              <h3>🎯 Secure Search Results</h3>
              <p>{result.message}</p>
              {result.position !== undefined && (
                <p><strong>Position:</strong> {result.position}</p>
              )}
            </div>
          )}

          {stats && (
            <div className="card full-width">
              <h3>📊 SMPC Security Statistics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <strong>Encryption Rounds:</strong><br />
                  <span style={{ color: '#0070f3', fontSize: '1.5rem' }}>{stats.totalEncryptionRounds}</span>
                </div>
                <div>
                  <strong>Secure Comparisons:</strong><br />
                  <span style={{ color: '#ff9800', fontSize: '1.5rem' }}>{stats.totalComparisons}</span>
                </div>
                <div>
                  <strong>Security Level:</strong><br />
                  <span style={{ color: '#4caf50', fontSize: '1.1rem' }}>{stats.securityLevel}</span>
                </div>
                <div>
                  <strong>Protocol:</strong><br />
                  <span style={{ color: '#9c27b0', fontSize: '1.1rem' }}>{stats.protocolCompliance}</span>
                </div>
              </div>
            </div>
          )}

          {log.length > 0 && (
            <div className="card full-width log-card">
              <h3>🔐 SMPC Protocol Log</h3>
              <div className="log-container">
                {log.map((entry, index) => (
                  <div key={index} className={`log-entry ${entry.type}`}>
                    <span className={`log-party ${entry.type}`}>{entry.party || 'System'}:</span>
                    <span className="log-message">{entry.message}</span>
                    {entry.cryptoData && (
                      <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                        🔒 {entry.cryptoData.operation} | {entry.cryptoData.securityLevel}
                        {entry.cryptoData.shares && ` | Shares: ${entry.cryptoData.shares.length}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .search-btn {
          background: linear-gradient(45deg, #0070f3, #00d4ff);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .search-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 112, 243, 0.3);
        }
        
        .visualize-btn {
          background: linear-gradient(45deg, #ff9800, #ffd54f);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .visualize-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(255, 152, 0, 0.3);
        }
      `}</style>
    </div>
  );
}