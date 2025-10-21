import { useCallback, useRef, useState } from 'hono/jsx/dom';

export const useDragAndDrop = (
  reorderFile: (from: number, to: number) => void
) => {
  const draggedIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const registerDraggable = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      node.draggable = true;
    }
  }, []);

  const handleDragStart = useCallback((index: number) => (event: DragEvent) => {
    event.stopPropagation();
    draggedIndexRef.current = index;
    setDragOverIndex(index);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
  }, []);

  const handleDragEnter = useCallback((index: number) => (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOverIndex(prev => (prev === index ? prev : index));
  }, []);

  const handleDragOver = useCallback((index: number) => (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    setDragOverIndex(prev => (prev === index ? prev : index));
  }, []);

  const handleDragLeave = useCallback((index: number) => (event: DragEvent) => {
    event.stopPropagation();
    setDragOverIndex(prev => (prev === index ? null : prev));
  }, []);

  const handleDrop = useCallback((index: number) => (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const from = draggedIndexRef.current ?? parseInt(event.dataTransfer?.getData('text/plain') || '-1', 10);
    if (!Number.isNaN(from)) {
      reorderFile(from, index);
    }
    draggedIndexRef.current = null;
    setDragOverIndex(null);
  }, [reorderFile]);

  const handleDragEnd = useCallback(() => {
    draggedIndexRef.current = null;
    setDragOverIndex(null);
  }, []);

  return {
    dragOverIndex,
    registerDraggable,
    handleDragStart,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  };
};
