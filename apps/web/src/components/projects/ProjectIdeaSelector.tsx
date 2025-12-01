import { useState } from 'react';

interface ProjectIdea {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  technologies: string[];
}

interface ProjectIdeaSelectorProps {
  ideas: ProjectIdea[];
  onSelect?: (id: string) => void;
}

export function ProjectIdeaSelector({ ideas, onSelect }: ProjectIdeaSelectorProps) {
  const [filter, setFilter] = useState<string>('all');

  const filteredIdeas = filter === 'all'
    ? ideas
    : ideas.filter((idea) => idea.difficulty === filter);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Project Ideas</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIdeas.map((idea) => (
          <div
            key={idea.id}
            onClick={() => onSelect?.(idea.id)}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">{idea.title}</h3>
              <span className={`text-xs px-2 py-1 rounded ${
                idea.difficulty === 'beginner' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                idea.difficulty === 'intermediate' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
              }`}>
                {idea.difficulty}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{idea.description}</p>
            <div className="flex flex-wrap gap-1">
              {idea.technologies.map((tech) => (
                <span key={tech} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
