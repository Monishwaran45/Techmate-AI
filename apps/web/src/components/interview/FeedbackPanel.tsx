interface Evaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

interface FeedbackPanelProps {
  evaluation: Evaluation;
}

export function FeedbackPanel({ evaluation }: FeedbackPanelProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Feedback</h3>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Overall Score</span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{evaluation.score}/100</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${evaluation.score}%` }}
          />
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">{evaluation.feedback}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Strengths</h4>
          <ul className="space-y-1">
            {evaluation.strengths.map((strength, index) => (
              <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                <span className="mr-2">✓</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-orange-600 dark:text-orange-400 mb-2">Areas to Improve</h4>
          <ul className="space-y-1">
            {evaluation.improvements.map((improvement, index) => (
              <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                <span className="mr-2">→</span>
                {improvement}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
