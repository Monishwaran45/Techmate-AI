interface ScoreBreakdown {
  atsCompatibility: number;
  contentQuality: number;
  formatting: number;
}

interface ResumeScoreCardProps {
  overallScore: number;
  breakdown: ScoreBreakdown;
  suggestions: string[];
}

export function ResumeScoreCard({ overallScore, breakdown, suggestions }: ResumeScoreCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resume Score</h3>
      
      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">{overallScore}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Overall Score</div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700 dark:text-gray-300">ATS Compatibility</span>
            <span className="font-medium text-gray-900 dark:text-white">{breakdown.atsCompatibility}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${breakdown.atsCompatibility}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700 dark:text-gray-300">Content Quality</span>
            <span className="font-medium text-gray-900 dark:text-white">{breakdown.contentQuality}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full"
              style={{ width: `${breakdown.contentQuality}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700 dark:text-gray-300">Formatting</span>
            <span className="font-medium text-gray-900 dark:text-white">{breakdown.formatting}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full"
              style={{ width: `${breakdown.formatting}%` }}
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Suggestions</h4>
        <ul className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
              <span className="mr-2">•</span>
              {suggestion}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
