type OptionsPanelProps = {
  addComments: boolean;
  preserveHeaders: boolean;
  remapTools: boolean;
  template: string;
  outputFilename: string;
  onAddCommentsChange: (value: boolean) => void;
  onPreserveHeadersChange: (value: boolean) => void;
  onRemapToolsChange: (value: boolean) => void;
  onTemplateChange: (value: string) => void;
  onFilenameChange: (value: string) => void;
};

const TEMPLATE_OPTIONS = [
  { value: 'none', label: 'なし' },
  { value: 'basic', label: '基本' },
  { value: 'fanuc', label: 'Fanuc' },
  { value: 'detailed', label: '詳細' },
  { value: 'minimal', label: '最小限' }
];

export const OptionsPanel = ({
  addComments,
  preserveHeaders,
  remapTools,
  template,
  outputFilename,
  onAddCommentsChange,
  onPreserveHeadersChange,
  onRemapToolsChange,
  onTemplateChange,
  onFilenameChange
}: OptionsPanelProps) => (
  <section class="bg-white rounded-lg shadow-sm border border-gray-200">
    <div class="p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">オプション設定</h2>

      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label class="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-primary hover:bg-blue-50 transition-all group">
            <input
              type="checkbox"
              class="hidden"
              checked={addComments}
              onChange={(event) => onAddCommentsChange((event.target as HTMLInputElement).checked)}
            />
            <div class="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0 flex items-center justify-center mt-0.5 group-has-[:checked]:bg-primary group-has-[:checked]:border-primary transition-all">
              <svg class="w-3 h-3 text-white opacity-0 group-has-[:checked]:opacity-100" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 6l3 3 5-6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900">ファイル区切りコメント</div>
              <div class="text-xs text-gray-500 mt-0.5">各ファイルの境界を明示</div>
            </div>
          </label>

          <label class="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-primary hover:bg-blue-50 transition-all group">
            <input
              type="checkbox"
              class="hidden"
              checked={preserveHeaders}
              onChange={(event) => onPreserveHeadersChange((event.target as HTMLInputElement).checked)}
            />
            <div class="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0 flex items-center justify-center mt-0.5 group-has-[:checked]:bg-primary group-has-[:checked]:border-primary transition-all">
              <svg class="w-3 h-3 text-white opacity-0 group-has-[:checked]:opacity-100" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 6l3 3 5-6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900">ヘッダー保持</div>
              <div class="text-xs text-gray-500 mt-0.5">プログラム番号を保持</div>
            </div>
          </label>

          <label class="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-primary hover:bg-blue-50 transition-all group">
            <input
              type="checkbox"
              class="hidden"
              checked={remapTools}
              onChange={(event) => onRemapToolsChange((event.target as HTMLInputElement).checked)}
            />
            <div class="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0 flex items-center justify-center mt-0.5 group-has-[:checked]:bg-primary group-has-[:checked]:border-primary transition-all">
              <svg class="w-3 h-3 text-white opacity-0 group-has-[:checked]:opacity-100" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 6l3 3 5-6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900">ツール番号再マッピング</div>
              <div class="text-xs text-gray-500 mt-0.5">重複するT番号を自動的に振り直す</div>
            </div>
          </label>

          <label class="select-label flex flex-col gap-2 border border-gray-200 rounded-lg p-3">
            <strong>テンプレート</strong>
            <select
              class="template-select border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-all"
              value={template}
              onChange={(event) => onTemplateChange((event.target as HTMLSelectElement).value)}
            >
              {TEMPLATE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label class="select-label block border border-gray-200 rounded-lg p-3">
          <strong class="block mb-2">出力ファイル名</strong>
          <input
            type="text"
            value={outputFilename}
            onInput={(event) => onFilenameChange((event.target as HTMLInputElement).value)}
            class="filename-input w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-all"
            placeholder="merged.nc"
          />
          <small class="text-gray-500 mt-2 block">拡張子は自動的に .nc が付きます</small>
        </label>
      </div>
    </div>
  </section>
);
