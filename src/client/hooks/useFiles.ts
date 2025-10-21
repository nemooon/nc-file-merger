import { useCallback, useState } from 'hono/jsx/dom';
import { UploadEntry } from '../types';
import { createEntryId } from '../utils';

export const useFiles = () => {
  const [files, setFiles] = useState<UploadEntry[]>([]);

  const addFiles = useCallback((incoming: File[]) => {
    if (!incoming.length) return;
    setFiles(prev => {
      const existing = new Set(prev.map(entry => entry.file.name));
      const additions = incoming.filter(file => !existing.has(file.name));
      if (additions.length === 0) {
        return prev;
      }
      const mapped = additions.map(file => ({ id: createEntryId(file), file }));
      return [...prev, ...mapped];
    });
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const moveFileUp = useCallback((index: number) => {
    if (index === 0) return;
    setFiles(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const moveFileDown = useCallback((index: number) => {
    setFiles(prev => {
      if (index >= prev.length - 1) {
        return prev;
      }
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const reorderFile = useCallback((from: number, to: number) => {
    if (from === to) return;
    setFiles(prev => {
      if (from < 0 || from >= prev.length || to < 0 || to >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  return {
    files,
    addFiles,
    removeFile,
    moveFileUp,
    moveFileDown,
    reorderFile
  };
};
