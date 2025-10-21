import { ValidationResponse, ValidationIssue } from '../types';
import { renderIssueList } from './renderIssueList';

type ValidationPanelProps = {
  validation: ValidationResponse | null;
};

export const ValidationPanel = ({ validation }: ValidationPanelProps) => {
  if (!validation || validation.results?.length === 0) {
    return null;
  }

  return (
    <section class="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">検証結果</h2>
        <div class="bg-gray-50 rounded-xl p-5 space-y-4">
          {validation.results.map(result => (
            <div key={result.filename} class="bg-white border border-gray-200 rounded-lg p-5">
              <h3 class="font-semibold text-lg mb-3 text-gray-800">{result.filename}</h3>

              {result.validation.valid ? (
                <div class="bg-green-50 border border-green-500 rounded-lg p-4 mb-4 text-green-800">
                  ✓ ファイルは有効です
                </div>
              ) : (
                <div class="bg-red-50 border border-red-500 rounded-lg p-4 mb-4">
                  <div class="font-semibold text-red-900 mb-2">エラーが見つかりました:</div>
                  {renderIssueList(result.validation.errors)}
                </div>
              )}

              {result.validation.warnings.length > 0 && (
                <div class="bg-yellow-50 border border-yellow-500 rounded-lg p-4 mb-4">
                  <div class="font-semibold text-yellow-900 mb-2">警告:</div>
                  {renderIssueList(result.validation.warnings)}
                </div>
              )}

              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <ValidationStat label="総行数" value={result.stats.totalLines} />
                <ValidationStat label="コード行" value={result.stats.codeLines} />
                <ValidationStat label="コメント行" value={result.stats.commentLines} />
                <ValidationStat label="空行" value={result.stats.emptyLines} />
              </div>

              {result.stats.tools.length > 0 && (
                <div class="mt-4">
                  <div class="text-sm font-semibold text-gray-700 mb-2">使用ツール:</div>
                  <div class="flex flex-wrap gap-2">
                    {result.stats.tools.map(tool => (
                      <span key={tool} class="px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ValidationStat = ({ label, value }: { label: string; value: number }) => (
  <div class="bg-gray-50 rounded-lg p-3">
    <div class="text-xs text-gray-600 mb-1">{label}</div>
    <div class="text-xl font-bold text-gray-800">{value}</div>
  </div>
);
