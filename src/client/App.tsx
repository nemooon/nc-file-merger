import { useCallback, useEffect, useRef, useState } from 'hono/jsx/dom';
import { useFiles } from './hooks/useFiles';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useApiActions } from './hooks/useApiActions';
import { suggestOutputFilename } from './utils';
import { UploadArea } from './components/UploadArea';
import { FileList } from './components/FileList';
import { OptionsPanel } from './components/OptionsPanel';
import { ActionsPanel } from './components/ActionsPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { ValidationPanel } from './components/ValidationPanel';

export function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    files,
    addFiles,
    removeFile,
    moveFileUp,
    moveFileDown,
    reorderFile
  } = useFiles();
  const {
    dragOverIndex,
    registerDraggable,
    handleDragStart,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  } = useDragAndDrop(reorderFile);

  const [addComments, setAddComments] = useState(true);
  const [preserveHeaders, setPreserveHeaders] = useState(false);
  const [remapTools, setRemapTools] = useState(true);
  const [template, setTemplate] = useState('none');
  const [outputFilename, setOutputFilename] = useState('merged.nc');
  const [filenameTouched, setFilenameTouched] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const {
    isLoading,
    loadingMessage,
    errorMessage,
    validation,
    preview,
    previewLines,
    handleValidate,
    handlePreview,
    handleMerge,
    setErrorMessage,
    setValidation,
    setPreview
  } = useApiActions({
    files,
    addComments,
    preserveHeaders,
    remapTools,
    template,
    outputFilename
  });

  useEffect(() => {
    if (files.length === 0) {
      setFilenameTouched(false);
      setOutputFilename('merged.nc');
      setValidation(null);
      setPreview(null);
      return;
    }
    if (!filenameTouched) {
      setOutputFilename(suggestOutputFilename(files));
    }
  }, [files, filenameTouched]);

  const hasFiles = files.length > 0;
  const actionDisabled = !hasFiles || isLoading;

  const handleFileInputChange = useCallback((event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    const selectedFiles = Array.from(target.files ?? []);
    addFiles(selectedFiles);
    target.value = '';
  }, [addFiles]);

  useEffect(() => {
    const input = fileInputRef.current;
    if (!input) return;
    const listener = (event: Event) => handleFileInputChange(event);
    input.addEventListener('change', listener);
    return () => {
      input.removeEventListener('change', listener);
    };
  }, [handleFileInputChange]);

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadAreaDragOver = (event: DragEvent) => {
    event.preventDefault();
    setIsDraggingOver(true);
  };

  const handleUploadAreaDragLeave = (event: DragEvent) => {
    event.preventDefault();
    setIsDraggingOver(false);
  };

  const handleUploadAreaDrop = (event: DragEvent) => {
    event.preventDefault();
    setIsDraggingOver(false);
    const dropped = Array.from(event.dataTransfer?.files ?? []);
    addFiles(dropped);
  };

  return (
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">NC File Merger</h1>
              <p class="text-sm text-gray-500">CNCプログラムファイルの統合ツール</p>
            </div>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {errorMessage && (
          <div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            <section class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">ファイル選択</h2>

                <UploadArea
                  isDraggingOver={isDraggingOver}
                  fileInputRef={fileInputRef}
                  onClick={handleUploadAreaClick}
                  onDragOver={handleUploadAreaDragOver}
                  onDragLeave={handleUploadAreaDragLeave}
                  onDrop={handleUploadAreaDrop}
                  onFileInputChange={handleFileInputChange}
                />

                <FileList
                  files={files}
                  dragOverIndex={dragOverIndex}
                  registerDraggable={registerDraggable}
                  onDragStart={handleDragStart}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  onMoveUp={moveFileUp}
                  onMoveDown={moveFileDown}
                  onRemove={removeFile}
                />
              </div>
            </section>

            <OptionsPanel
              addComments={addComments}
              preserveHeaders={preserveHeaders}
              remapTools={remapTools}
              template={template}
              outputFilename={outputFilename}
              onAddCommentsChange={setAddComments}
              onPreserveHeadersChange={setPreserveHeaders}
              onRemapToolsChange={setRemapTools}
              onTemplateChange={setTemplate}
              onFilenameChange={(value) => {
                setOutputFilename(value);
                setFilenameTouched(true);
              }}
            />
          </div>

          <div class="space-y-6">
            <ActionsPanel
              disabled={actionDisabled}
              onValidate={handleValidate}
              onPreview={handlePreview}
              onMerge={handleMerge}
            />

            <section class="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 class="text-sm font-semibold text-blue-900 mb-2">使い方</h3>
              <ol class="text-xs text-blue-800 space-y-2">
                <li class="flex gap-2">
                  <span class="font-semibold">1.</span>
                  <span>NCファイルをアップロード</span>
                </li>
                <li class="flex gap-2">
                  <span class="font-semibold">2.</span>
                  <span>ドラッグ&ドロップで順序を調整</span>
                </li>
                <li class="flex gap-2">
                  <span class="font-semibold">3.</span>
                  <span>オプションを設定</span>
                </li>
                <li class="flex gap-2">
                  <span class="font-semibold">4.</span>
                  <span>結合してダウンロード</span>
                </li>
              </ol>
            </section>
          </div>
        </div>

        <PreviewPanel preview={preview} previewLines={previewLines} />
        <ValidationPanel validation={validation} />
      </main>

      <footer class="bg-white border-t border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-gray-500">
          NC File Merger v1.0.0 | Built with Hono
        </div>
      </footer>

      <div class={`loading-overlay fixed inset-0 bg-black/40 backdrop-blur-sm transition-all ${isLoading ? 'flex' : 'hidden'}`}>
        <div class="spinner"></div>
        <p class="text-white text-sm mt-4">{loadingMessage}</p>
      </div>
    </div>
  );
}
