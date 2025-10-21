/**
 * NC File Validator
 * Validates G-code syntax and detects common errors
 */

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  line: number;
  message: string;
  code: string;
}

export interface ValidationWarning {
  line: number;
  message: string;
  code: string;
}

export class NCValidator {
  /**
   * Validate NC file content
   */
  static validate(content: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const lines = content.split('\n');

    let inComment = false;
    let parenDepth = 0;

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) return;

      // Check for parenthesis balance
      for (const char of trimmed) {
        if (char === '(') {
          parenDepth++;
          inComment = true;
        } else if (char === ')') {
          parenDepth--;
          if (parenDepth < 0) {
            errors.push({
              line: lineNum,
              message: 'Unmatched closing parenthesis',
              code: 'UNMATCHED_PAREN'
            });
          }
          if (parenDepth === 0) inComment = false;
        }
      }

      // Skip if line is a comment
      if (trimmed.startsWith('(') && trimmed.endsWith(')')) return;
      if (trimmed.startsWith(';')) return;

      // Check for valid G-code pattern
      const hasGCode = /[GM]\d+/i.test(trimmed);
      const hasCoordinate = /[XYZABCUVWIJK]-?\d+\.?\d*/i.test(trimmed);
      const hasTCode = /T\d+/i.test(trimmed);
      const hasSCode = /S\d+/i.test(trimmed);
      const hasFCode = /F\d+\.?\d*/i.test(trimmed);
      const hasOCode = /O\d+/i.test(trimmed);
      const hasPercent = trimmed === '%';
      const hasNCode = /N\d+/i.test(trimmed);

      // Line should have at least some valid code
      if (!hasGCode && !hasCoordinate && !hasTCode && !hasSCode &&
          !hasFCode && !hasOCode && !hasPercent && !hasNCode &&
          !trimmed.startsWith('(') && !trimmed.startsWith(';')) {
        warnings.push({
          line: lineNum,
          message: 'Line may not contain valid G-code',
          code: 'POSSIBLY_INVALID'
        });
      }

      // Check for common mistakes
      if (/[GM]\s+\d+/i.test(trimmed)) {
        warnings.push({
          line: lineNum,
          message: 'Space detected between G/M and number (e.g., "G 01" should be "G01")',
          code: 'SPACE_IN_CODE'
        });
      }

      // Check for missing coordinates on movement commands
      if (/G0?[0-3]\b/i.test(trimmed) && !hasCoordinate) {
        warnings.push({
          line: lineNum,
          message: 'Movement command without coordinates',
          code: 'NO_COORDINATES'
        });
      }

      // Check for feed rate without movement
      if (hasFCode && !hasGCode && lineNum > 1) {
        warnings.push({
          line: lineNum,
          message: 'Feed rate (F) specified without G-code command',
          code: 'ORPHAN_FEED'
        });
      }
    });

    // Check for unclosed parenthesis at end of file
    if (parenDepth !== 0) {
      errors.push({
        line: lines.length,
        message: 'Unclosed parenthesis at end of file',
        code: 'UNCLOSED_PAREN'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if content appears to be a valid NC file
   */
  static isValidNCFile(content: string): boolean {
    const gcodePattern = /[GM]\d+/i;
    return gcodePattern.test(content);
  }

  /**
   * Get statistics about NC file
   */
  static getStats(content: string): {
    totalLines: number;
    codeLines: number;
    commentLines: number;
    emptyLines: number;
    gCodes: Set<string>;
    mCodes: Set<string>;
    tools: Set<string>;
  } {
    const lines = content.split('\n');
    const stats = {
      totalLines: lines.length,
      codeLines: 0,
      commentLines: 0,
      emptyLines: 0,
      gCodes: new Set<string>(),
      mCodes: new Set<string>(),
      tools: new Set<string>()
    };

    lines.forEach(line => {
      const trimmed = line.trim();

      if (!trimmed) {
        stats.emptyLines++;
        return;
      }

      if (trimmed.startsWith('(') || trimmed.startsWith(';')) {
        stats.commentLines++;
        return;
      }

      stats.codeLines++;

      // Extract G codes
      const gMatches = trimmed.matchAll(/G(\d+)/gi);
      for (const match of gMatches) {
        stats.gCodes.add(`G${match[1]}`);
      }

      // Extract M codes
      const mMatches = trimmed.matchAll(/M(\d+)/gi);
      for (const match of mMatches) {
        stats.mCodes.add(`M${match[1]}`);
      }

      // Extract tool numbers
      const tMatches = trimmed.matchAll(/T(\d+)/gi);
      for (const match of tMatches) {
        stats.tools.add(`T${match[1]}`);
      }
    });

    return stats;
  }
}
