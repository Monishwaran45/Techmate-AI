interface Question {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

interface QuestionBankProps {
  questions: Question[];
  onSelect?: (id: string) => void;
}

export function QuestionBank({ questions, onSelect }: QuestionBankProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
      <div className="p-4 border-b border-gray-300 dark:border-gray-600">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Practice Questions</h2>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {questions.map((question) => (
          <div
            key={question.id}
            onClick={() => onSelect?.(question.id)}
            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">{question.title}</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                  {question.category}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  question.difficulty === 'easy' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                  question.difficulty === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                  'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                }`}>
                  {question.difficulty}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
