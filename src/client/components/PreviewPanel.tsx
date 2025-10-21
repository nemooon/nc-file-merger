import { PreviewResponse, ToolMapping } from '../types';

type PreviewPanelProps = {
  preview: PreviewResponse | null;
  previewLines: { key: string; lineNumber: number | null; content: string; isEllipsis?: boolean }[];
};

export const PreviewPanel = ({ preview, previewLines }: PreviewPanelProps) => {
  if (!preview) return null;

  const conflictCount = preview.conflicts?.conflictingTools?.length ?? 0;
  const hasConflicts = preview.conflicts?.hasToolConflicts ?? false;
  const toolMappings = preview.toolMappings ?? [];

  return (
    <section class="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">プレビュー</h2>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <PreviewStat label="ファイル数" value={preview.fileStats?.length ?? 0} />
          <PreviewStat label="予想行数" value={preview.estimatedOutputLines ?? 0} />
          <PreviewStat
            label="競合ツール数"
            value={conflictCount}
            emphasis={hasConflicts ? 'text-red-500' : 'text-primary'}
          />
          <PreviewStat label="ツール再マップ" value={toolMappings.length} />
        </div>

        {hasConflicts && (
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-5 text-sm text-red-800">
            ツール番号が競合しています: {preview.conflicts?.conflictingTools?.join(', ')}
          </div>
        )}

        {toolMappings.length > 0 && (
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
            <h3 class="font-semibold text-blue-900 mb-2">ツール番号マッピング</h3>
            <div class="text-sm text-blue-800 space-y-1">
              {toolMappings.map(renderMapping)}
            </div>
          </div>
        )}

        {previewLines.length > 0 && (
          <div class="bg-gray-900 text-gray-100 rounded-lg p-5 font-mono text-sm leading-relaxed overflow-x-auto max-h-[600px] overflow-y-auto">
            {previewLines.map(line =>
              line.isEllipsis ? (
                <div key={line.key} class="italic opacity-80 bg-amber-900/10 py-1 px-0 my-1">
                  <span class="whitespace-pre">{line.content}</span>
                </div>
              ) : (
                <div key={line.key}>
                  <span class="text-gray-500 mr-4 select-none">{String(line.lineNumber).padStart(4, ' ')}</span>
                  <span class="whitespace-pre">{line.content}</span>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
};

const PreviewStat = ({ label, value, emphasis }: { label: string; value: number; emphasis?: string }) => (
  <div class="bg-white border border-gray-200 rounded-lg p-4 text-center">
    <div class={`text-3xl font-bold ${emphasis ?? 'text-primary'} mb-1`}>{value}</div>
    <div class="text-sm text-gray-600">{label}</div>
  </div>
);

const renderMapping = (mapping: ToolMapping) => (
  <div>
    ファイル {mapping.fileIndex + 1}: {mapping.original} → {mapping.remapped}
  </div>
);
