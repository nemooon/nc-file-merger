import { useCallback, useMemo, useState } from 'hono/jsx/dom';
import {
  PreviewResponse,
  PreviewLine,
  UploadEntry,
  ValidationResponse
} from '../types';
import {
  buildPreviewLines,
  getErrorMessage
} from '../utils';

type UseApiActionsParams = {
  files: UploadEntry[];
  addComments: boolean;
  preserveHeaders: boolean;
  remapTools: boolean;
  template: string;
  outputFilename: string;
};

export const useApiActions = ({
  files,
  addComments,
  preserveHeaders,
  remapTools,
  template,
  outputFilename
}: UseApiActionsParams) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('処理中...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);

  const hasFiles = files.length > 0;

  const createFormData = useCallback((includeOptions: boolean): FormData => {
    const formData = new FormData();
    files.forEach(entry => formData.append('files', entry.file));
    if (includeOptions) {
      formData.append('addComments', String(addComments));
      formData.append('preserveHeaders', String(preserveHeaders));
      formData.append('remapTools', String(remapTools));
      formData.append('template', template);
    }
    return formData;
  }, [files, addComments, preserveHeaders, remapTools, template]);

  const runRequest = useCallback(
    async (
      action: 'validate' | 'preview' | 'merge',
      formData: FormData
    ) => {
      const response = await fetch(`/api/${action}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = getErrorMessage(errorBody);
        throw new Error(message || `${action} request failed`);
      }

      return response;
    },
    []
  );

  const handleValidate = useCallback(async () => {
    if (!hasFiles || isLoading) return;
    setIsLoading(true);
    setLoadingMessage('検証中...');
    setErrorMessage(null);
    try {
      const response = await runRequest('validate', createFormData(false));
      const data = (await response.json()) as ValidationResponse;
      setValidation(data);
    } catch (error) {
      console.error('Validation error:', error);
      setErrorMessage(error instanceof Error ? error.message : '検証に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [hasFiles, isLoading, runRequest, createFormData]);

  const handlePreview = useCallback(async () => {
    if (!hasFiles || isLoading) return;
    setIsLoading(true);
    setLoadingMessage('プレビュー生成中...');
    setErrorMessage(null);
    try {
      const response = await runRequest('preview', createFormData(true));
      const data = (await response.json()) as PreviewResponse;
      setPreview(data);
    } catch (error) {
      console.error('Preview error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'プレビュー生成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [hasFiles, isLoading, runRequest, createFormData]);

  const handleMerge = useCallback(async () => {
    if (!hasFiles || isLoading) return;
    setIsLoading(true);
    setLoadingMessage('結合中...');
    setErrorMessage(null);
    try {
      const response = await runRequest('merge', createFormData(true));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = outputFilename.endsWith('.nc') ? outputFilename : `${outputFilename}.nc`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Merge error:', error);
      setErrorMessage(error instanceof Error ? error.message : '結合に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [hasFiles, isLoading, runRequest, createFormData, outputFilename]);

  const previewLines: PreviewLine[] = useMemo(
    () => buildPreviewLines(preview),
    [preview]
  );

  return {
    isLoading,
    loadingMessage,
    errorMessage,
    preview,
    previewLines,
    validation,
    handleValidate,
    handlePreview,
    handleMerge,
    setErrorMessage,
    setValidation,
    setPreview
  };
};
