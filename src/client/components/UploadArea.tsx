import { RefObject } from 'hono/jsx/dom';

type UploadAreaProps = {
  isDraggingOver: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onClick: () => void;
  onDragOver: (event: DragEvent) => void;
  onDragLeave: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
  onFileInputChange: (event: Event) => void;
};

export const UploadArea = ({
  isDraggingOver,
  fileInputRef,
  onClick,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileInputChange
}: UploadAreaProps) => (
  <div
    class={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
      isDraggingOver ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-primary hover:bg-blue-50'
    }`}
    onClick={onClick}
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
    onDrop={onDrop}
  >
    <input
      type="file"
      multiple
      accept=".nc,.NC,.txt"
      class="hidden"
      ref={fileInputRef}
      onInput={onFileInputChange}
    />

    <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg class="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    </div>

    <p class="text-sm font-medium text-gray-900 mb-1">ファイルをドロップまたはクリック</p>
    <p class="text-xs text-gray-500">.nc, .NC, .txt形式に対応</p>
  </div>
);
