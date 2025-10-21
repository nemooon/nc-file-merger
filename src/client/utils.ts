import {
  PreviewResponse,
  PreviewLine,
  UploadEntry
} from './types';

export const createEntryId = (file: File) =>
  `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(16).slice(2)}`;

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const findCommonPrefix = (names: string[]): string => {
  if (names.length <= 1) return names[0] ?? '';
  const sorted = [...names].sort();
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  let i = 0;
  while (i < first.length && first[i] === last[i]) {
    i++;
  }
  return first.substring(0, i).replace(/[-_\s\d]+$/, '');
};

export const suggestOutputFilename = (entries: UploadEntry[]): string => {
  if (entries.length === 0) return 'merged.nc';
  const filenames = entries.map(entry => entry.file.name.replace(/\.nc$/i, ''));
  if (filenames.length === 1) {
    return `${filenames[0]}_merged.nc`;
  }
  const commonPrefix = findCommonPrefix(filenames);
  if (commonPrefix && commonPrefix.length > 2) {
    return `${commonPrefix}_merged.nc`;
  }
  const first = filenames[0];
  const baseMatch = first.match(/^(.+?)[-_]?\d*$/);
  if (baseMatch && baseMatch[1]) {
    return `${baseMatch[1]}_merged.nc`;
  }
  return 'merged.nc';
};

export const buildPreviewLines = (data: PreviewResponse | null): PreviewLine[] => {
  if (!data?.mergedContent || !data.fileStats?.length) {
    return [];
  }
  const lines = data.mergedContent.split('\n');
  const displayLines: PreviewLine[] = [];
  let currentLine = 1;

  data.fileStats.forEach((stat) => {
    const limit = Math.min(15, stat.lines);
    for (let i = 0; i < limit; i++) {
      const number = currentLine + i;
      displayLines.push({
        key: `${stat.filename}-${number}`,
        lineNumber: number,
        content: lines[number - 1] ?? ''
      });
    }
    if (stat.lines > 15) {
      displayLines.push({
        key: `${stat.filename}-ellipsis`,
        lineNumber: null,
        content: `... (${stat.filename}の残り${stat.lines - 15}行を省略) ...`,
        isEllipsis: true
      });
    }
    currentLine += stat.lines;
  });

  return displayLines;
};

export const getErrorMessage = (body: unknown): string | null => {
  if (body && typeof body === 'object' && 'error' in body) {
    const message = (body as { error?: unknown }).error;
    return typeof message === 'string' ? message : null;
  }
  return null;
};
