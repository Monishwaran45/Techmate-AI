interface Stats {
  totalSessions: number;
  averageScore: number;
  completedQuestions: number;
  strongAreas: string[];
}

interface PerformanceStatsProps {
  stats: Stats;
}

export function PerformanceStats({ stats }: PerformanceStatsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Performance Overview</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalSessions}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Sessions</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.averageScore}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Avg Score</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.completedQuestions}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Questions</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.strongAreas.length}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Strong Areas</div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Your Strong Areas</h4>
        <div className="flex flex-wrap gap-2">
          {stats.strongAreas.map((area, index) => (
            <span key={index} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm">
              {area}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
