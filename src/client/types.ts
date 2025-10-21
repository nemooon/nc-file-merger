export type ValidationIssue = {
  line: number;
  message: string;
  code: string;
};

export type ValidationStats = {
  totalLines: number;
  codeLines: number;
  commentLines: number;
  emptyLines: number;
  gCodes: string[];
  mCodes: string[];
  tools: string[];
};

export type ValidationEntry = {
  filename: string;
  validation: {
    valid: boolean;
    errors: ValidationIssue[];
    warnings: ValidationIssue[];
  };
  stats: ValidationStats;
};

export type ValidationResponse = {
  results: ValidationEntry[];
};

export type PreviewFileStat = {
  filename: string;
  lines: number;
  tools: string[];
  gCodes: string[];
  mCodes: string[];
};

export type ToolMapping = {
  original: string;
  remapped: string;
  fileIndex: number;
};

export type PreviewResponse = {
  fileStats: PreviewFileStat[];
  conflicts?: {
    hasToolConflicts: boolean;
    conflictingTools: string[];
  };
  estimatedOutputLines: number;
  mergedContent?: string;
  toolMappings?: ToolMapping[];
};

export type UploadEntry = {
  id: string;
  file: File;
};

export type PreviewLine = {
  key: string;
  lineNumber: number | null;
  content: string;
  isEllipsis?: boolean;
};
