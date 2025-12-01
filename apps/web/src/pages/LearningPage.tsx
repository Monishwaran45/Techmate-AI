import { useState, useEffect } from 'react';
import { AppShell } from '../components/layout';
import { useLearningStore } from '../store/learningStore';
import { useAuthStore } from '../store/authStore';

export function LearningPage() {
  const [activeTab, setActiveTab] = useState<'roadmap' | 'progress' | 'explore'>('roadmap');
  const [generating, setGenerating] = useState(false);
  const [conceptInput, setConcept] = useState('');
  const [explanation, setExplanation] = useState('');
  const [explaining, setExplaining] = useState(false);
  const user = useAuthStore((state) => state.user);
  const {
    roadmap,
    progressStats,
    loading,
    error,
    fetchRoadmap,
    generateRoadmap,
    updateProgress,
    fetchProgressStats,
    explainConcept,
  } = useLearningStore();

  useEffect(() => {
    fetchRoadmap();
    fetchProgressStats();
  }, []);

  const handleGenerateRoadmap = async () => {
    setGenerating(true);
    try {
      const skills = user?.profile?.skills || [];
      const goals = user?.profile?.goals?.length ? user.profile.goals : ['Become a full-stack developer'];
      const experience = user?.profile?.experience || 'beginner';
      await generateRoadmap(skills, goals, experience);
    } catch (err) {
      console.error('Failed to generate roadmap:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleExplainConcept = async () => {
    if (!conceptInput.trim()) return;
    setExplaining(true);
    try {
      const result = await explainConcept(conceptInput);
      setExplanation(result);
    } catch (err) {
      console.error('Failed to explain concept:', err);
    } finally {
      setExplaining(false);
    }
  };

  const completedCount = roadmap?.milestones?.filter((m) => m.completed).length || 0;
  const totalCount = roadmap?.milestones?.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Learning Center</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              AI-powered personalized learning paths tailored to your goals
            </p>
          </div>
          <div className="flex gap-2">
            {(['roadmap', 'progress', 'explore'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {tab === 'roadmap' ? '🗺️ Roadmap' : tab === 'progress' ? '📊 Progress' : '🔍 Explore'}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Roadmap Tab */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6">
            {loading ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Loading your learning path...</p>
                </div>
              </div>
            ) : roadmap ? (
              <>
                {/* Roadmap Header */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold">{roadmap.title}</h2>
                      <p className="text-blue-100 mt-1 text-sm">
                        {completedCount} of {totalCount} milestones completed
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-3xl font-bold">{progressPercent}%</p>
                        <p className="text-blue-200 text-sm">Complete</p>
                      </div>
                      <button
                        onClick={handleGenerateRoadmap}
                        disabled={generating}
                        className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {generating ? 'Regenerating...' : '🔄 Regenerate'}
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 bg-white/20 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-white h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Milestones */}
                <div className="space-y-4">
                  {roadmap.milestones.map((milestone, idx) => (
                    <div
                      key={milestone.id}
                      className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-2 transition-all ${
                        milestone.completed
                          ? 'border-green-200 dark:border-green-800'
                          : 'border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                            milestone.completed
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                          }`}
                        >
                          {milestone.completed ? '✓' : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3
                                className={`font-semibold text-lg ${
                                  milestone.completed
                                    ? 'text-gray-400 dark:text-gray-500'
                                    : 'text-gray-900 dark:text-white'
                                }`}
                              >
                                {milestone.title}
                              </h3>
                              <p className="text-gray-500 dark:text-gray-400 mt-1">{milestone.description}</p>
                            </div>
                            {!milestone.completed && (
                              <button
                                onClick={() => updateProgress(milestone.id)}
                                className="flex-shrink-0 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                              >
                                Mark Complete
                              </button>
                            )}
                          </div>
                          {milestone.topics && milestone.topics.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {milestone.topics.map((topic) => (
                                <span
                                  key={topic}
                                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🎯</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Create Your Learning Path</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-2 max-w-md mx-auto">
                  Get a personalized roadmap based on your skills and career goals.
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
                  Your skills: {user?.profile?.skills?.join(', ') || 'Not set'} •
                  Goals: {user?.profile?.goals?.join(', ') || 'Not set'}
                </p>
                <button
                  onClick={handleGenerateRoadmap}
                  disabled={generating}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg shadow-blue-600/25"
                >
                  {generating ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </span>
                  ) : (
                    '✨ Generate My Roadmap'
                  )}
                </button>
              </div>
            )}
          </div>
        )}


        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Milestones', value: progressStats?.totalMilestones || 0, icon: '📚', color: 'from-blue-500 to-blue-600' },
                { label: 'Completed', value: progressStats?.completedMilestones || 0, icon: '✅', color: 'from-green-500 to-green-600' },
                { label: 'In Progress', value: progressStats?.inProgressMilestones || 0, icon: '🔄', color: 'from-yellow-500 to-orange-500' },
                { label: 'Completion Rate', value: `${progressStats?.completionPercentage || 0}%`, icon: '📊', color: 'from-purple-500 to-purple-600' },
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

            {/* Progress Visualization */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Learning Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Overall Progress</span>
                    <span className="font-medium text-gray-900 dark:text-white">{progressStats?.completionPercentage || 0}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${progressStats?.completionPercentage || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Achievement Badges */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Achievements</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: '🌟', name: 'First Steps', desc: 'Complete your first milestone', unlocked: (progressStats?.completedMilestones || 0) >= 1 },
                  { icon: '🔥', name: 'On Fire', desc: 'Complete 5 milestones', unlocked: (progressStats?.completedMilestones || 0) >= 5 },
                  { icon: '🏆', name: 'Achiever', desc: 'Complete 10 milestones', unlocked: (progressStats?.completedMilestones || 0) >= 10 },
                  { icon: '👑', name: 'Master', desc: 'Complete all milestones', unlocked: progressStats?.completionPercentage === 100 },
                ].map((badge) => (
                  <div
                    key={badge.name}
                    className={`p-4 rounded-xl text-center transition-all ${
                      badge.unlocked
                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800'
                        : 'bg-gray-50 dark:bg-gray-700/50 opacity-50'
                    }`}
                  >
                    <span className="text-3xl block mb-2">{badge.icon}</span>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{badge.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{badge.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Explore Tab */}
        {activeTab === 'explore' && (
          <div className="space-y-6">
            {/* Concept Explainer */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">🤖 AI Concept Explainer</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                Ask our AI to explain any technical concept in simple terms
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={conceptInput}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="e.g., What is a REST API?"
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && handleExplainConcept()}
                />
                <button
                  onClick={handleExplainConcept}
                  disabled={explaining || !conceptInput.trim()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {explaining ? 'Thinking...' : 'Explain'}
                </button>
              </div>
              {explanation && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{explanation}</p>
                </div>
              )}
            </div>

            {/* Recommended Topics */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recommended for You</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {(user?.profile?.skills || ['JavaScript', 'React', 'TypeScript']).slice(0, 3).map((skill) => (
                  <div
                    key={skill}
                    className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setConcept(`Advanced ${skill} concepts and best practices`);
                      setActiveTab('explore');
                    }}
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white">{skill} Deep Dive</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Advanced concepts and patterns</p>
                    <span className="text-blue-600 text-sm font-medium mt-2 inline-block">Learn more →</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Topics */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Popular Topics</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  'REST API', 'GraphQL', 'Docker', 'Kubernetes', 'CI/CD',
                  'Microservices', 'System Design', 'Data Structures', 'Algorithms',
                  'React Hooks', 'TypeScript Generics', 'Node.js Streams'
                ].map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setConcept(topic)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
