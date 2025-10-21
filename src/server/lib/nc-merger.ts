/**
 * NC File Merger
 * Core logic for merging multiple NC files with header/footer handling
 */

import { ToolRemapper } from './tool-remapper.js';
import { NCValidator } from './nc-validator.js';

export interface NCFile {
  filename: string;
  content: string;
}

export interface MergeOptions {
  addComments?: boolean;
  preserveHeaders?: boolean;
  remapTools?: boolean;
  template?: {
    header?: string;
    footer?: string;
  };
}

export interface MergeResult {
  content: string;
  toolMappings: Array<{ original: string; remapped: string; fileIndex: number }>;
  stats: {
    totalFiles: number;
    totalLines: number;
    toolsRemapped: number;
  };
}

export class NCMerger {
  /**
   * Merge multiple NC files into one
   */
  static merge(files: NCFile[], options: MergeOptions = {}): MergeResult {
    const {
      addComments = true,
      preserveHeaders = false,
      remapTools = false,
      template
    } = options;

    if (files.length === 0) {
      throw new Error('No files to merge');
    }

    // Validate all files first
    for (const file of files) {
      if (!NCValidator.isValidNCFile(file.content)) {
        throw new Error(`${file.filename} does not appear to be a valid NC file`);
      }
    }

    let processedFiles = files;
    let toolMappings: Array<{ original: string; remapped: string; fileIndex: number }> = [];

    // Apply tool remapping if enabled
    if (remapTools) {
      const remapResult = ToolRemapper.remapMultipleFiles(files);
      processedFiles = remapResult.files.map((result, index) => ({
        filename: files[index].filename,
        content: result.content
      }));
      toolMappings = remapResult.allMappings;
    }

    const mergedLines: string[] = [];
    let totalLines = 0;

    // Add template header if provided
    if (template?.header) {
      mergedLines.push(template.header);
      mergedLines.push('');
    }

    // Add initial comment
    if (addComments) {
      mergedLines.push('(====================================)');
      mergedLines.push('(NC File Merger - Merged Output)');
      mergedLines.push(`(Total Files: ${files.length})`);
      mergedLines.push(`(Generated: ${new Date().toISOString()})`);
      if (remapTools && toolMappings.length > 0) {
        mergedLines.push(`(Tools Remapped: ${toolMappings.length})`);
      }
      mergedLines.push('(====================================)');
      mergedLines.push('');
    }

    // Process each file
    processedFiles.forEach((file, index) => {
      if (addComments) {
        mergedLines.push('');
        mergedLines.push(`(====================================)`);
        mergedLines.push(`(File ${index + 1}: ${file.filename})`);
        mergedLines.push(`(====================================)`);
        mergedLines.push('');
      }

      const lines = file.content.split('\n').map(line => line.trim());
      totalLines += lines.length;

      let skipNextEmpty = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip empty lines if flag is set
        if (skipNextEmpty && !line) {
          continue;
        }
        skipNextEmpty = false;

        // Skip empty lines at the beginning
        if (mergedLines.length === 0 && !line) {
          continue;
        }

        // Handle program start/end markers (%)
        if (line === '%') {
          if (preserveHeaders) {
            // Only add % at the very start and very end
            if (index === 0 && i === 0) {
              mergedLines.push(line);
            }
            // We'll add the closing % at the end
          }
          // Always skip % markers
          continue;
        }

        // Handle program numbers (O codes)
        if (line.match(/^O\d+/i)) {
          if (preserveHeaders && index === 0) {
            mergedLines.push(line);
          }
          // Always skip O codes (don't duplicate program numbers)
          continue;
        }

        // Handle program end codes (M30, M02)
        if (line.match(/^M30\b/i) || line.match(/^M02\b/i)) {
          // Skip M30/M02 except for the last file
          if (index === files.length - 1) {
            mergedLines.push(line);
          }
          continue;
        }

        // Handle M00 (program stop) - might want to keep these
        if (line.match(/^M00\b/i)) {
          if (addComments) {
            mergedLines.push(`(Program stop from ${file.filename})`);
          }
          mergedLines.push(line);
          continue;
        }

        // Add the line
        if (line) {
          mergedLines.push(line);
        }
      }
    });

    // Add tool mapping table as comment if tools were remapped
    if (remapTools && toolMappings.length > 0 && addComments) {
      mergedLines.push('');
      mergedLines.push('(====================================)');
      mergedLines.push('(Tool Remapping Table)');
      mergedLines.push('(====================================)');

      const mappingsByFile: Map<number, Array<{ original: string; remapped: string }>> = new Map();
      toolMappings.forEach(mapping => {
        if (!mappingsByFile.has(mapping.fileIndex)) {
          mappingsByFile.set(mapping.fileIndex, []);
        }
        mappingsByFile.get(mapping.fileIndex)!.push({
          original: mapping.original,
          remapped: mapping.remapped
        });
      });

      mappingsByFile.forEach((mappings, fileIndex) => {
        mergedLines.push(`(File ${fileIndex + 1}: ${files[fileIndex].filename})`);
        mappings.forEach(mapping => {
          mergedLines.push(`(  ${mapping.original} -> ${mapping.remapped})`);
        });
      });

      mergedLines.push('(====================================)');
      mergedLines.push('');
    }

    // Ensure program end if not present
    const lastLine = mergedLines[mergedLines.length - 1];
    if (lastLine && !lastLine.match(/^M30/i) && !lastLine.match(/^M02/i)) {
      mergedLines.push('M30');
    }

    // Add template footer if provided
    if (template?.footer) {
      mergedLines.push('');
      mergedLines.push(template.footer);
    }

    // Add final % if preserving headers
    if (preserveHeaders) {
      mergedLines.push('%');
    }

    return {
      content: mergedLines.join('\n'),
      toolMappings,
      stats: {
        totalFiles: files.length,
        totalLines,
        toolsRemapped: toolMappings.length
      }
    };
  }

  /**
   * Preview merge without actually merging
   * Returns information about what would be merged
   */
  static preview(files: NCFile[], options: MergeOptions = {}): {
    fileStats: Array<{
      filename: string;
      lines: number;
      tools: string[];
      gCodes: string[];
      mCodes: string[];
    }>;
    conflicts: {
      hasToolConflicts: boolean;
      conflictingTools: string[];
    };
    estimatedOutputLines: number;
  } {
    const fileStats = files.map(file => {
      const stats = NCValidator.getStats(file.content);
      return {
        filename: file.filename,
        lines: stats.totalLines,
        tools: Array.from(stats.tools).sort(),
        gCodes: Array.from(stats.gCodes).sort(),
        mCodes: Array.from(stats.mCodes).sort()
      };
    });

    // Check for tool conflicts
    const allTools = new Set<string>();
    const conflictingTools = new Set<string>();

    files.forEach(file => {
      const tools = ToolRemapper.extractTools(file.content);
      tools.forEach(tool => {
        if (allTools.has(tool)) {
          conflictingTools.add(`T${tool}`);
        }
        allTools.add(tool);
      });
    });

    // Estimate output lines
    let estimatedLines = 0;
    files.forEach(file => {
      estimatedLines += file.content.split('\n').length;
    });

    // Add overhead for comments and headers
    if (options.addComments) {
      estimatedLines += files.length * 6; // Comment blocks per file
      estimatedLines += 10; // Header comments
    }

    return {
      fileStats,
      conflicts: {
        hasToolConflicts: conflictingTools.size > 0,
        conflictingTools: Array.from(conflictingTools).sort()
      },
      estimatedOutputLines: estimatedLines
    };
  }
}
