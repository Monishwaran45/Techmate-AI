import { useState } from 'react';

interface ResumeEditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
}

export function ResumeEditor({ initialContent = '', onSave }: ResumeEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    setTimeout(() => {
      onSave?.(content);
      setSaving(false);
    }, 1000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
      <div className="p-4 border-b border-gray-300 dark:border-gray-600 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resume Editor</h3>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      
      <div className="p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-96 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Paste or type your resume content here..."
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {content.length} characters
        </p>
      </div>
    </div>
  );
}
