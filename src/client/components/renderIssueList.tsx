import { ValidationIssue } from '../types';

export const renderIssueList = (issues: ValidationIssue[]) => {
  if (!issues.length) return null;
  return (
    <ul class="list-disc list-inside text-sm space-y-1">
      {issues.map(issue => (
        <li class="text-gray-800">
          <span class="font-semibold">L{issue.line}:</span> {issue.message}
          <span class="ml-2 text-gray-500 text-xs">{issue.code}</span>
        </li>
      ))}
    </ul>
  );
};
