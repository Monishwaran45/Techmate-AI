interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  matchScore: number;
  matchReasons: string[];
}

interface JobMatchListProps {
  matches: JobMatch[];
  onSelect?: (id: string) => void;
}

export function JobMatchList({ matches, onSelect }: JobMatchListProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
      <div className="p-4 border-b border-gray-300 dark:border-gray-600">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Job Matches</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Ranked by compatibility</p>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {matches.map((match) => (
          <div
            key={match.id}
            onClick={() => onSelect?.(match.id)}
            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{match.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{match.company} • {match.location}</p>
              </div>
              <div className="flex items-center">
                <div className="text-right mr-2">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{match.matchScore}%</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Match</div>
                </div>
              </div>
            </div>
            
            <div className="mt-2">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Why this matches:</p>
              <div className="flex flex-wrap gap-1">
                {match.matchReasons.map((reason, index) => (
                  <span key={index} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
