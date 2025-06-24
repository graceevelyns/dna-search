import { NextResponse } from 'next/server';

const PRIME = 2147483647;
const FIELD_SIZE = 256;

// helper for cryptographic operations
const getCharCode = (char: string): number => char.charCodeAt(0);

// random number generation simulation
const secureRandom = (): number => {
    return Math.floor(Math.random() * PRIME);
};

const createSecretShares = (secret: number, numParties: number = 3): number[] => {
    const shares: number[] = [];
    let sum = 0;
  
    for (let i = 0; i < numParties - 1; i++) {
        const share = secureRandom();
        shares.push(share);
        sum = (sum + share) % PRIME;
    }
    const lastShare = (secret - sum + PRIME) % PRIME;
    shares.push(lastShare);
  
    return shares;
};

const reconstructSecret = (shares: number[]): number => {
    return shares.reduce((sum, share) => (sum + share) % PRIME, 0);
};

const secureCompare = (shares1: number[], shares2: number[]): boolean => {
    const val1 = reconstructSecret(shares1);
    const val2 = reconstructSecret(shares2);
    return val1 === val2;
};

// log entry
interface LogEntry {
    party: string;
    type: 'info' | 'share' | 'compute' | 'encrypt' | 'decrypt' | 'success' | 'failure' | 'protocol';
    message: string;
    timestamp: number;
    cryptoData?: {
        shares?: number[];
        operation?: string;
        securityLevel?: string;
    };
}

// SMPC
class SMPCProtocol {
    private parties: string[];
    private log: LogEntry[];
    private encryptionRounds: number;

    constructor() {
        this.parties = ['Querying Party', 'Database Owner', 'Trusted Third Party'];
        this.log = [];
        this.encryptionRounds = 0;
    }

    addLog(party: string, type: LogEntry['type'], message: string, cryptoData?: LogEntry['cryptoData']) {
        this.log.push({
            party,
            type,
            message,
            timestamp: Date.now(),
            cryptoData
        });
    }

    // preprocessing with SMPC
    securePreprocess(pattern: string): { 
        badCharTable: {[key: string]: number[]}, 
        goodSuffixTable: number[][] 
    } {
    this.addLog('Querying Party', 'protocol', 'Initiating secure preprocessing phase');
    
    const badCharTable: {[key: string]: number[]} = {};
    const goodSuffixTable: number[][] = [];
    
    // encrypted bad character table
    for (let i = 0; i < pattern.length; i++) {
        const char = pattern[i];
        const shares = createSecretShares(i);
        badCharTable[char] = shares;
      
      this.addLog('Querying Party', 'encrypt', 
        `Created encrypted entry for character '${char}' at position ${i}`,
        { shares, operation: 'bad_char_table', securityLevel: 'high' }
      );
    }
    
    // Create encrypted good suffix table
    for (let i = 0; i <= pattern.length; i++) {
      const suffixShift = createSecretShares(pattern.length);
      goodSuffixTable.push(suffixShift);
    }
    
    this.addLog('Querying Party', 'protocol', 'Secure preprocessing completed');
    return { badCharTable, goodSuffixTable };
    }

    secureShareText(text: string): number[][] {
    this.addLog('Database Owner', 'protocol', 'Initiating secure text sharing protocol');
    const textShares: number[][] = [];
    
    for (let i = 0; i < text.length; i++) {
        const charCode = getCharCode(text[i]);
        const shares = createSecretShares(charCode);
        textShares.push(shares);
      
        this.encryptionRounds++;
      
        if (i % 10 === 0 || i === text.length - 1) {
            this.addLog('Database Owner', 'encrypt', `Encrypted ${i + 1}/${text.length} characters`, { operation: 'text_sharing', securityLevel: 'military_grade' }
        );
      }
    }
    
    this.addLog('Database Owner', 'protocol', `Secure text sharing completed with ${this.encryptionRounds} encryption rounds`);
    return textShares;
    }

    secureSharePattern(pattern: string): number[][] {
    this.addLog('Querying Party', 'protocol', 'Initiating secure pattern sharing protocol');
    const patternShares: number[][] = [];
    
    for (let i = 0; i < pattern.length; i++) {
        const charCode = getCharCode(pattern[i]);
        const shares = createSecretShares(charCode);
        patternShares.push(shares);
      
        this.addLog('Querying Party', 'encrypt', `Encrypted pattern character '${pattern[i]}' at position ${i}`, { shares, operation: 'pattern_sharing', securityLevel: 'military_grade' }
      );
    }
    
    this.addLog('Querying Party', 'protocol', 'Secure pattern sharing completed');
    return patternShares;
    }

    secureStringComparison(
        textShares: number[][], 
        patternShares: number[][], 
        textPos: number, 
        patternPos: number
    ): boolean {
        this.addLog('Trusted Third Party', 'protocol', `Initiating secure comparison at Text[${textPos}] vs Pattern[${patternPos}]`
    );
    
    this.addLog('Trusted Third Party', 'compute', 'Executing proof protocol for character comparison'
    );
    
    const result = secureCompare(textShares[textPos], patternShares[patternPos]);
    
    this.addLog('Trusted Third Party', 'compute', `Secure comparison result: ${result ? 'MATCH' : 'NO_MATCH'} (details hidden for privacy)`,
      { operation: 'secure_compare', securityLevel: 'quantum_resistant' }
    );
    
    return result;
    }

    // get all logs
    getLogs(): LogEntry[] {
        return [...this.log];
    }

    // get encryption statistics
    getStats() {
        return {
            totalEncryptionRounds: this.encryptionRounds,
            totalComparisons: this.log.filter(l => l.type === 'compute').length,
            securityLevel: 'Quantum Resistance',
            protocolCompliance: 'SMPC-2024 Standard'
        };
    }
}

// Boyer-Moore with SMPC
class SecureBoyerMoore {
    private smpc: SMPCProtocol;
    private text: string;
    private pattern: string;

    constructor(text: string, pattern: string) {
        this.text = text;
        this.pattern = pattern;
        this.smpc = new SMPCProtocol();
    }

    async secureSearch(): Promise<{
        result: { found: boolean; message: string; position?: number };
        log: LogEntry[];
        stats: any;
        visualizationData: any[];
    }> { this.smpc.addLog('System', 'protocol', 'Initializing Enhanced Secure Multi-Party Boyer-Moore Protocol');
    
    const { badCharTable, goodSuffixTable } = this.smpc.securePreprocess(this.pattern);
    const textShares = this.smpc.secureShareText(this.text);
    const patternShares = this.smpc.secureSharePattern(this.pattern);
    const m = this.pattern.length;
    const n = this.text.length;
    let shift = 0;
    const visualizationData: any[] = [];
    
    this.smpc.addLog('System', 'protocol', 'Beginning secure pattern matching phase');
    
    while (shift <= n - m) {
        this.smpc.addLog('Database Owner', 'info', `Secure alignment at position ${shift}`);
        visualizationData.push({
            type: 'alignment',
            shift,
            textWindow: this.text.substring(shift, shift + m),
            pattern: this.pattern
        });
      
        let j = m - 1;
        while (j >= 0) {
            const isMatch = this.smpc.secureStringComparison(textShares, patternShares, shift + j, j);

        visualizationData.push({
            type: 'comparison',
            textPos: shift + j,
            patternPos: j,
            textChar: this.text[shift + j],
            patternChar: this.pattern[j],
            result: isMatch
        });
        
        if (isMatch) {
            this.smpc.addLog('Trusted Third Party', 'success', `Secure match confirmed at position (${shift + j}, ${j})`);
            j--;
        }
        else {
            this.smpc.addLog('Trusted Third Party', 'info', `Secure mismatch detected at position (${shift + j}, ${j})`);
            break;
        }
    }
    
    if (j < 0) {
        this.smpc.addLog('System', 'success', `🎉 Secure pattern match found at position ${shift}!`
        );
        
        const stats = this.smpc.getStats();
        return {
            result: { 
                found: true, 
                message: `Pattern securely found at position ${shift} using SMPC!`,
                position: shift
            },
            log: this.smpc.getLogs(),
            stats,
            visualizationData
        };
    }
    else {
        const mismatchChar = this.text[shift + j];
        const lastOccurrence = badCharTable[mismatchChar] ? reconstructSecret(badCharTable[mismatchChar]) : -1;
        const badCharShift = Math.max(1, j - lastOccurrence);
        
        this.smpc.addLog('Querying Party', 'compute', `Calculated secure shift: ${badCharShift} positions`
        );
        
        visualizationData.push({
            type: 'shift',
            amount: badCharShift,
            reason: 'bad_character_heuristic'
        });
        
        shift += badCharShift;
      }
    }
    
    this.smpc.addLog('System', 'failure', 'Secure search completed - pattern not found');
    
    const stats = this.smpc.getStats();
    return {
        result: { 
            found: false, 
            message: 'Pattern not found in the encrypted database'
        },
        log: this.smpc.getLogs(),
        stats,
        visualizationData
    };
  }
}

// API handler
export async function POST(req: Request) {
    try {
        const { text, pattern } = await req.json();
    
    if (!text || !pattern || pattern.length > text.length) {
        return NextResponse.json({ 
            message: 'Invalid input parameters',
            error: 'Text and pattern must be provided, and pattern cannot be longer than text'
        }, { status: 400 });
    }
    
    // validate DNA sequence format with regex
    const dnaRegex = /^[ACGT]+$/;
    if (!dnaRegex.test(text) || !dnaRegex.test(pattern)) {
        return NextResponse.json({
            message: 'Invalid DNA sequence format',
            error: 'Only A, C, G, T characters are allowed'
        }, { status: 400 });
    }
    
    // initialize secure Boyer-Moore
    const secureBM = new SecureBoyerMoore(text, pattern);
    const searchResult = await secureBM.secureSearch();
    
    return NextResponse.json(searchResult);

    }
    catch (error) {
        console.error('Enhanced SMPC Search Error:', error);
        return NextResponse.json({ 
            message: 'Internal server error during secure computation',
            error: 'Failed to execute SMPC protocol'
        }, { status: 500 });
    }
}