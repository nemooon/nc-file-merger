import { UploadEntry } from '../types';
import { formatFileSize } from '../utils';

type FileListProps = {
  files: UploadEntry[];
  dragOverIndex: number | null;
  registerDraggable: (node: HTMLDivElement | null) => void;
  onDragStart: (index: number) => (event: DragEvent) => void;
  onDragEnter: (index: number) => (event: DragEvent) => void;
  onDragOver: (index: number) => (event: DragEvent) => void;
  onDragLeave: (index: number) => (event: DragEvent) => void;
  onDrop: (index: number) => (event: DragEvent) => void;
  onDragEnd: () => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (index: number) => void;
};

export const FileList = ({
  files,
  dragOverIndex,
  registerDraggable,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  onRemove
}: FileListProps) => {
  return (
    <div class="mt-4 space-y-2">
      {files.map((entry, index) => {
        const isFirst = index === 0;
        const isLast = index === files.length - 1;
        const highlight = dragOverIndex === index;
        return (
          <div
            key={entry.id}
            draggable="true"
            class={`bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-3 transition-all cursor-move hover:bg-gray-100 hover:border-gray-300 hover:shadow-sm ${
              highlight ? 'border-primary bg-indigo-100 -translate-y-1 shadow' : ''
            }`}
            ref={registerDraggable}
            onDragStart={onDragStart(index)}
            onDragEnter={onDragEnter(index)}
            onDragOver={onDragOver(index)}
            onDragLeave={onDragLeave(index)}
            onDrop={onDrop(index)}
            onDragEnd={onDragEnd}
          >
            <div class="text-gray-400 hover:text-primary transition-colors p-1 cursor-grab active:cursor-grabbing">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M8 6h8M8 12h8M8 18h8" stroke-width="2" stroke-linecap="round" />
              </svg>
            </div>
            <div class="font-bold text-lg text-primary min-w-[40px] text-center">#{index + 1}</div>
            <div class="flex items-center gap-3 flex-1">
              <div class="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center font-semibold text-sm">
                NC
              </div>
              <div class="flex-1">
                <div class="font-semibold text-gray-800 mb-1 truncate">{entry.file.name}</div>
                <div class="text-sm text-gray-600">{formatFileSize(entry.file.size)}</div>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button
                class="file-action-btn p-1.5 rounded-lg text-primary hover:bg-indigo-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                disabled={isFirst}
                onClick={() => onMoveUp(index)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 15l-6-6-6 6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
              <button
                class="file-action-btn p-1.5 rounded-lg text-primary hover:bg-indigo-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                disabled={isLast}
                onClick={() => onMoveDown(index)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
              <button
                class="file-remove p-2 rounded-lg text-red-500 hover:bg-red-50 transition-all"
                onClick={() => onRemove(index)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
