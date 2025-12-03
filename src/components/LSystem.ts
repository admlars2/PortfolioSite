import seedrandom from "seedrandom";

export interface ParametricSymbol {
  name: string;
  params: number[];
}

export interface LSystemRule {
  symbol: string;
  condition?: (params: number[]) => boolean;
  production: string | ((params: number[]) => string);
}

export interface LSystemConfig {
  axiom: string;
  rules: LSystemRule[];
  iterations: number;
  seed?: number;
}

export class LSystemGenerator {
  private config: LSystemConfig;
  private rng: seedrandom.PRNG;

  constructor(config: LSystemConfig) {
    this.config = config;
    this.rng = seedrandom(config.seed !== undefined ? String(config.seed) : undefined);
  }

  /**
   * Get the RNG instance for use in other components
   */
  getRNG(): seedrandom.PRNG {
    return this.rng;
  }

  /**
   * Update the configuration (useful when parameters change)
   */
  updateConfig(config: Partial<LSystemConfig>): void {
    this.config = { ...this.config, ...config };
    // Reinitialize RNG if seed changed
    if (config.seed !== undefined) {
      this.rng = seedrandom(String(config.seed));
    }
  }

  /**
   * Parse a parametric symbol from string like "T(1.0, 0)"
   */
  private parseSymbol(symbolStr: string): ParametricSymbol | null {
    const match = symbolStr.match(/^([A-Za-z]+)(?:\(([^)]+)\))?$/);
    if (!match) return null;

    const name = match[1];
    const paramsStr = match[2];
    
    if (!paramsStr) {
      return { name, params: [] };
    }

    const params = paramsStr.split(',').map(p => parseFloat(p.trim()));
    return { name, params };
  }

  /**
   * Format a parametric symbol to string
   */
  private formatSymbol(symbol: ParametricSymbol): string {
    if (symbol.params.length === 0) {
      return symbol.name;
    }
    return `${symbol.name}(${symbol.params.join(', ')})`;
  }

  /**
   * Evaluate a production string with parameter substitutions
   * Handles expressions like s*0.8, d+1, etc.
   */
  private evaluateProduction(production: string, params: number[]): string {
    // Replace parameter references (s, d, etc.) with actual values
    // Simple approach: assume params are named by position (s=0, d=1, etc.)
    let result = production;
    
    // Replace parameter names with values
    const paramNames = ['s', 'd', 't', 'r']; // Common parameter names
    
    // First, replace simple parameter references
    for (let i = 0; i < Math.min(paramNames.length, params.length); i++) {
      const name = paramNames[i];
      const value = params[i];
      
      // Replace standalone parameter references (not part of other identifiers)
      result = result.replace(new RegExp(`\\b${name}\\b`, 'g'), value.toString());
    }
    
    // Evaluate simple arithmetic expressions
    // This is a simplified evaluator - handles basic +, -, *, / operations
    result = result.replace(/([\d.]+)\s*([+\-*/])\s*([\d.]+)/g, (match, a, op, b) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      switch (op) {
        case '+': return (numA + numB).toString();
        case '-': return (numA - numB).toString();
        case '*': return (numA * numB).toString();
        case '/': 
          // Guard against division by zero
          if (numB === 0) {
            console.warn(`Division by zero in L-system production: ${match}`);
            return match; // Return original expression if division by zero
          }
          return (numA / numB).toString();
        default: return match;
      }
    });
    
    return result;
  }

  /**
   * Check if a condition is satisfied
   */
  private checkCondition(condition: string, params: number[]): boolean {
    // Simple condition parser for expressions like "s > 0.3" or "s <= 0.3"
    const paramNames = ['s', 'd', 't', 'r'];
    
    // Replace parameter names with values
    let expr = condition;
    for (let i = 0; i < Math.min(paramNames.length, params.length); i++) {
      const name = paramNames[i];
      const value = params[i];
      expr = expr.replace(new RegExp(`\\b${name}\\b`, 'g'), value.toString());
    }
    
    // Evaluate comparison expressions
    const comparisons = [
      { pattern: /([\d.]+)\s*>\s*([\d.]+)/, eval: (a: number, b: number) => a > b },
      { pattern: /([\d.]+)\s*>=\s*([\d.]+)/, eval: (a: number, b: number) => a >= b },
      { pattern: /([\d.]+)\s*<\s*([\d.]+)/, eval: (a: number, b: number) => a < b },
      { pattern: /([\d.]+)\s*<=\s*([\d.]+)/, eval: (a: number, b: number) => a <= b },
      { pattern: /([\d.]+)\s*==\s*([\d.]+)/, eval: (a: number, b: number) => Math.abs(a - b) < 0.0001 },
    ];
    
    for (const comp of comparisons) {
      const match = expr.match(comp.pattern);
      if (match) {
        const a = parseFloat(match[1]);
        const b = parseFloat(match[2]);
        return comp.eval(a, b);
      }
    }
    
    return true; // Default to true if condition can't be parsed
  }

  /**
   * Find matching rule for a symbol
   */
  private findMatchingRule(symbol: ParametricSymbol): LSystemRule | null {
    for (const rule of this.config.rules) {
      if (rule.symbol === symbol.name) {
        // Check condition if present
        if (rule.condition) {
          if (rule.condition(symbol.params)) {
            return rule;
          }
        } else {
          return rule; // No condition, always matches
        }
      }
    }
    return null;
  }

  /**
   * Rewrite a single symbol according to rules
   */
  private rewriteSymbol(symbol: ParametricSymbol): string {
    const rule = this.findMatchingRule(symbol);
    
    if (!rule) {
      // No rule found, return symbol as-is
      return this.formatSymbol(symbol);
    }
    
    if (typeof rule.production === 'function') {
      return rule.production(symbol.params);
    } else {
      return this.evaluateProduction(rule.production, symbol.params);
    }
  }

  /**
   * Generate the L-system string through iterations
   */
  generate(): string {
    let currentString = this.config.axiom;
    
    for (let iteration = 0; iteration < this.config.iterations; iteration++) {
      let newString = '';
      let i = 0;
      
      while (i < currentString.length) {
        const char = currentString[i];
        
        // Handle turtle symbols - copy them as-is
        // Includes: [ ] (push/pop), + - (yaw), & ^ (pitch), \ / (roll)
        if (/[\[\]+\-&^\\/]/.test(char)) {
          newString += char;
          i++;
          continue;
        }
        
        // Handle F - might be F or F(params)
        if (char === 'F') {
          let j = i + 1;
          if (j < currentString.length && currentString[j] === '(') {
            // F(params) - parse it
            let parenCount = 0;
            let symbolStr = 'F';
            while (j < currentString.length) {
              symbolStr += currentString[j];
              if (currentString[j] === '(') parenCount++;
              if (currentString[j] === ')') {
                parenCount--;
                if (parenCount === 0) {
                  j++;
                  break;
                }
              }
              j++;
            }
            // F(params) is a turtle command, not rewritten
            newString += symbolStr;
            i = j;
          } else {
            // Just F
            newString += 'F';
            i++;
          }
          continue;
        }
        
        // Try to parse a parametric symbol (like T(s, d) or B(s))
        let symbolStr = '';
        let parenCount = 0;
        let j = i;
        let foundSymbol = false;
        
        // Check if this looks like a symbol name (letter)
        if (/[A-Za-z]/.test(char)) {
          symbolStr += char;
          j = i + 1;
          
          // Check for parameters
          if (j < currentString.length && currentString[j] === '(') {
            parenCount = 1;
            symbolStr += currentString[j];
            j++;
            
            while (j < currentString.length && parenCount > 0) {
              symbolStr += currentString[j];
              if (currentString[j] === '(') parenCount++;
              if (currentString[j] === ')') parenCount--;
              j++;
            }
          }
          
          const symbol = this.parseSymbol(symbolStr);
          if (symbol) {
            // Check if this symbol has a rule
            const rule = this.findMatchingRule(symbol);
            if (rule) {
              // Rewrite it
              newString += this.rewriteSymbol(symbol);
              foundSymbol = true;
            } else {
              // No rule, keep as-is
              newString += symbolStr;
            }
            i = j;
          } else {
            // Not a valid symbol, keep as-is
            newString += char;
            i++;
          }
        } else {
          // Not a symbol, keep as-is
          newString += char;
          i++;
        }
      }
      
      currentString = newString;
    }
    
    return currentString;
  }
}

