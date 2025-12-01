import { useState, useEffect } from 'react';
import { AppShell } from '../components/layout';
import { useProjectsStore } from '../store/projectsStore';
import { useAuthStore } from '../store/authStore';

export function ProjectsPage() {
  const [activeTab, setActiveTab] = useState<'ideas' | 'my-projects' | 'templates'>('ideas');
  const [generating, setGenerating] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const user = useAuthStore((state) => state.user);
  const {
    ideas,
    userProjects,
    loading,
    error,
    fetchIdeas,
    fetchUserProjects,
    generateIdeas,
    createProject,
  } = useProjectsStore();

  useEffect(() => {
    fetchIdeas();
    fetchUserProjects();
  }, []);

  const handleGenerateIdeas = async () => {
    setGenerating(true);
    try {
      const skills = user?.profile?.skills || ['JavaScript', 'React'];
      const interests = user?.profile?.goals || ['Build web applications'];
      await generateIdeas(skills, interests);
    } finally {
      setGenerating(false);
    }
  };

  const handleStartProject = async (ideaId: string) => {
    await createProject(ideaId);
    setActiveTab('my-projects');
  };

  const filteredIdeas = selectedDifficulty === 'all' 
    ? ideas 
    : ideas.filter(i => i.difficulty === selectedDifficulty);

  const completedProjects = userProjects.filter(p => p.status === 'completed').length;
  const inProgressProjects = userProjects.filter(p => p.status === 'in_progress').length;

  const projectTemplates = [
    { id: '1', name: 'E-commerce Store', icon: '🛒', tech: ['React', 'Node.js', 'Stripe'], difficulty: 'intermediate' },
    { id: '2', name: 'Social Media App', icon: '📱', tech: ['React Native', 'Firebase'], difficulty: 'advanced' },
    { id: '3', name: 'Portfolio Website', icon: '🎨', tech: ['Next.js', 'Tailwind'], difficulty: 'beginner' },
    { id: '4', name: 'Task Manager', icon: '✅', tech: ['React', 'Redux', 'Node.js'], difficulty: 'intermediate' },
    { id: '5', name: 'Blog Platform', icon: '📝', tech: ['Next.js', 'MDX', 'Prisma'], difficulty: 'intermediate' },
    { id: '6', name: 'Real-time Chat', icon: '💬', tech: ['Socket.io', 'React', 'Express'], difficulty: 'intermediate' },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Workshop</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Build real projects to strengthen your portfolio
            </p>
          </div>
          <div className="flex gap-2">
            {(['ideas', 'my-projects', 'templates'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/25'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {tab === 'ideas' ? '💡 Ideas' : tab === 'my-projects' ? `📁 My Projects (${userProjects.length})` : '📋 Templates'}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Ideas', value: ideas.length, icon: '💡', color: 'from-yellow-500 to-orange-500' },
            { label: 'In Progress', value: inProgressProjects, icon: '🔨', color: 'from-blue-500 to-blue-600' },
            { label: 'Completed', value: completedProjects, icon: '✅', color: 'from-green-500 to-green-600' },
            { label: 'Skills Used', value: user?.profile?.skills?.length || 0, icon: '🛠️', color: 'from-purple-500 to-purple-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
                <div className={`bg-gradient-to-r ${stat.color} text-white text-lg font-bold px-3 py-1 rounded-lg`}>
                  {stat.value}
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Ideas Tab */}
        {activeTab === 'ideas' && (
          <div className="space-y-6">
            {/* Filters & Generate */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Filter by difficulty:</span>
                  <div className="flex gap-2">
                    {['all', 'beginner', 'intermediate', 'advanced'].map((diff) => (
                      <button
                        key={diff}
                        onClick={() => setSelectedDifficulty(diff)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedDifficulty === diff
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleGenerateIdeas}
                  disabled={generating}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-green-600/25"
                >
                  {generating ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </span>
                  ) : (
                    '✨ Generate New Ideas'
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                Based on your skills: {user?.profile?.skills?.join(', ') || 'Update your profile for personalized ideas'}
              </p>
            </div>

            {/* Ideas Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Generating project ideas...</p>
                </div>
              </div>
            ) : filteredIdeas.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIdeas.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className={`h-2 bg-gradient-to-r ${
                      project.difficulty === 'beginner' ? 'from-green-400 to-green-500' :
                      project.difficulty === 'intermediate' ? 'from-yellow-400 to-orange-500' :
                      'from-red-400 to-red-500'
                    }`} />
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-green-600 transition-colors">
                          {project.title}
                        </h3>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          project.difficulty === 'beginner' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                          project.difficulty === 'intermediate' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }`}>
                          {project.difficulty}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.technologies.slice(0, 4).map((tech) => (
                          <span
                            key={tech}
                            className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                        {project.technologies.length > 4 && (
                          <span className="text-xs text-gray-500">+{project.technologies.length - 4} more</span>
                        )}
                      </div>
                      {project.estimatedHours && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1">
                          <span>⏱️</span> ~{project.estimatedHours} hours estimated
                        </p>
                      )}
                      <button
                        onClick={() => handleStartProject(project.id)}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2.5 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all"
                      >
                        Start This Project
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">💡</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Get Project Ideas</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Generate AI-powered project ideas tailored to your skills and career goals
                </p>
                <button
                  onClick={handleGenerateIdeas}
                  disabled={generating}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-green-600/25"
                >
                  {generating ? 'Generating...' : '✨ Generate Ideas'}
                </button>
              </div>
            )}
          </div>
        )}


        {/* My Projects Tab */}
        {activeTab === 'my-projects' && (
          <div className="space-y-6">
            {userProjects.length > 0 ? (
              <div className="space-y-4">
                {userProjects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg">{project.name}</h3>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            project.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                            project.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}>
                            {project.status === 'in_progress' ? 'In Progress' : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                          </span>
                        </div>
                        {project.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{project.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.map((tech) => (
                            <span
                              key={tech}
                              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="md:w-48">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-500 dark:text-gray-400">Progress</span>
                          <span className="font-bold text-gray-900 dark:text-white">{project.progress}%</span>
                        </div>
                        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              project.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">📁</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Projects Yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Start a project from our ideas or templates</p>
                <button
                  onClick={() => setActiveTab('ideas')}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Browse Project Ideas →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <p className="text-gray-500 dark:text-gray-400">
              Start with a pre-built template and customize it to your needs
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-green-200 dark:hover:border-green-800 transition-all duration-300 cursor-pointer group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                    {template.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{template.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.tech.map((t) => (
                      <span key={t} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      template.difficulty === 'beginner' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                      template.difficulty === 'intermediate' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>
                      {template.difficulty}
                    </span>
                    <button className="text-green-600 dark:text-green-400 font-medium text-sm hover:underline">
                      Use Template →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
