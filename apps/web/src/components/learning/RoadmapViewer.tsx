interface Milestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface RoadmapViewerProps {
  milestones: Milestone[];
  onMilestoneClick?: (id: string) => void;
}

export function RoadmapViewer({ milestones, onMilestoneClick }: RoadmapViewerProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Learning Roadmap</h2>
      <div className="space-y-3">
        {milestones.map((milestone, index) => (
          <div
            key={milestone.id}
            onClick={() => onMilestoneClick?.(milestone.id)}
            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
              milestone.completed
                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  milestone.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}>
                  {milestone.completed ? '✓' : index + 1}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">{milestone.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{milestone.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
