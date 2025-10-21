/**
 * Tool Number Remapper
 * Handles tool number (T code) remapping to avoid conflicts when merging NC files
 */

export interface ToolMapping {
  original: string;
  remapped: string;
  fileIndex: number;
}

export interface RemapResult {
  content: string;
  mappings: ToolMapping[];
}

export class ToolRemapper {
  /**
   * Extract all tool numbers from NC content
   */
  static extractTools(content: string): Set<string> {
    const tools = new Set<string>();
    const lines = content.split('\n');

    lines.forEach(line => {
      const matches = line.matchAll(/T(\d+)/gi);
      for (const match of matches) {
        tools.add(match[1]);
      }
    });

    return tools;
  }

  /**
   * Remap tool numbers in multiple NC files to avoid conflicts
   * @param files Array of NC file contents
   * @param startNumber Starting tool number for remapping (default: 1)
   * @returns Array of remapped contents and mapping information
   */
  static remapMultipleFiles(
    files: { filename: string; content: string }[],
    startNumber: number = 1
  ): {
    files: RemapResult[];
    allMappings: ToolMapping[];
  } {
    const allMappings: ToolMapping[] = [];
    let currentToolNumber = startNumber;
    const globalToolMap = new Map<string, string>(); // Map original tool to new tool number

    // First pass: collect all unique tools across all files
    const fileTools: Map<number, Set<string>> = new Map();
    files.forEach((file, index) => {
      const tools = this.extractTools(file.content);
      fileTools.set(index, tools);
    });

    // Create global mapping
    files.forEach((file, fileIndex) => {
      const tools = fileTools.get(fileIndex) || new Set();
      const sortedTools = Array.from(tools).sort((a, b) => parseInt(a) - parseInt(b));

      sortedTools.forEach(tool => {
        const key = `${fileIndex}-${tool}`;
        if (!globalToolMap.has(key)) {
          const newToolNumber = currentToolNumber.toString().padStart(tool.length, '0');
          globalToolMap.set(key, newToolNumber);

          allMappings.push({
            original: `T${tool}`,
            remapped: `T${newToolNumber}`,
            fileIndex
          });

          currentToolNumber++;
        }
      });
    });

    // Second pass: apply remapping to each file
    const remappedFiles = files.map((file, fileIndex) => {
      let content = file.content;
      const fileMappings: ToolMapping[] = [];

      const tools = fileTools.get(fileIndex) || new Set();
      const sortedTools = Array.from(tools).sort((a, b) => parseInt(b) - parseInt(a)); // Sort descending to avoid conflicts

      sortedTools.forEach(tool => {
        const key = `${fileIndex}-${tool}`;
        const newTool = globalToolMap.get(key);

        if (newTool) {
          // Replace T codes (case insensitive, with word boundaries)
          const regex = new RegExp(`\\bT${tool}\\b`, 'gi');
          content = content.replace(regex, `T${newTool}`);

          fileMappings.push({
            original: `T${tool}`,
            remapped: `T${newTool}`,
            fileIndex
          });
        }
      });

      return {
        content,
        mappings: fileMappings
      };
    });

    return {
      files: remappedFiles,
      allMappings
    };
  }

  /**
   * Remap tools in a single file
   * @param content NC file content
   * @param mapping Map of original tool numbers to new tool numbers
   */
  static remapSingleFile(
    content: string,
    mapping: Map<string, string>
  ): RemapResult {
    let remappedContent = content;
    const mappings: ToolMapping[] = [];

    // Sort by descending length to avoid partial replacements
    const sortedEntries = Array.from(mapping.entries())
      .sort((a, b) => b[0].length - a[0].length);

    sortedEntries.forEach(([original, remapped]) => {
      const regex = new RegExp(`\\bT${original}\\b`, 'gi');
      remappedContent = remappedContent.replace(regex, `T${remapped}`);

      mappings.push({
        original: `T${original}`,
        remapped: `T${remapped}`,
        fileIndex: 0
      });
    });

    return {
      content: remappedContent,
      mappings
    };
  }

  /**
   * Generate a mapping table for display
   */
  static generateMappingTable(mappings: ToolMapping[]): string {
    if (mappings.length === 0) {
      return 'No tool remapping required.';
    }

    let table = 'Tool Remapping:\n';
    table += '─'.repeat(40) + '\n';
    table += 'File | Original | New Tool\n';
    table += '─'.repeat(40) + '\n';

    mappings.forEach(mapping => {
      table += `  ${mapping.fileIndex + 1}  | ${mapping.original.padEnd(8)} | ${mapping.remapped}\n`;
    });

    table += '─'.repeat(40) + '\n';

    return table;
  }

  /**
   * Check if files have conflicting tool numbers
   */
  static hasConflicts(files: { filename: string; content: string }[]): boolean {
    const allTools = new Set<string>();
    let hasConflict = false;

    files.forEach(file => {
      const tools = this.extractTools(file.content);
      tools.forEach(tool => {
        if (allTools.has(tool)) {
          hasConflict = true;
        }
        allTools.add(tool);
      });
    });

    return hasConflict;
  }
}
