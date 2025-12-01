interface CodePreviewProps {
  code: string;
  language: string;
  filename: string;
}

export function CodePreview({ code, language, filename }: CodePreviewProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900 dark:text-white">{filename}</span>
        <span className="text-xs text-gray-600 dark:text-gray-400">{language}</span>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm text-gray-900 dark:text-white">{code}</code>
      </pre>
    </div>
  );
}
