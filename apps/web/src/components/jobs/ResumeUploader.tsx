import { useState, useRef } from 'react';

interface ResumeUploaderProps {
  onUpload?: (file: File) => void;
}

export function ResumeUploader({ onUpload }: ResumeUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      onUpload?.(droppedFile);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      onUpload?.(selectedFile);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload Resume</h3>
      
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleChange}
          className="hidden"
        />
        
        {file ? (
          <div>
            <div className="text-4xl mb-2">📄</div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {(file.size / 1024).toFixed(2)} KB
            </p>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-4 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Choose different file
            </button>
          </div>
        ) : (
          <div>
            <div className="text-4xl mb-2">📤</div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              Drag and drop your resume here, or
            </p>
            <button
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Browse Files
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Supported formats: PDF, DOC, DOCX
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
