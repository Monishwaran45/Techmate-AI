import { useEffect, useState } from 'react';
import { AppShell } from '../components/layout';
import { useAuthStore } from '../store/authStore';
import { useLearningStore } from '../store/learningStore';
import { useProductivityStore } from '../store/productivityStore';
import { useJobsStore } from '../store/jobsStore';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const [greeting, setGreeting] = useState('');
  const user = useAuthStore((state) => state.user);
  const { roadmap, progressStats, fetchRoadmap, fetchProgressStats, loading: learningLoading } = useLearningStore();
  const { tasks, fetchTasks, loading: tasksLoading } = useProductivityStore();
  const { matches, fetchMatches } = useJobsStore();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    fetchRoadmap();
    fetchProgressStats();
    fetchTasks();
    fetchMatches();
  }, []);

  const completedMilestones = roadmap?.milestones?.filter(m => m.completed).length || 0;
  const totalMilestones = roadmap?.milestones?.length || 1;
  const learningProgress = Math.round((completedMilestones / totalMilestones) * 100);
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const pendingTasks = tasks.filter(t => t.status !== 'done').slice(0, 3);
  const topMatches = matches.slice(0, 3);

  const stats = [
    { label: 'Learning Progress', value: `${learningProgress}%`, icon: '📚', color: 'from-blue-500 to-blue-600', link: '/learning' },
    { label: 'Tasks Done', value: `${completedTasks}/${tasks.length || 0}`, icon: '✅', color: 'from-green-500 to-green-600', link: '/productivity' },
    { label: 'Day Streak', value: progressStats?.currentStreak || 0, icon: '🔥', color: 'from-orange-500 to-red-500', link: '/learning' },
    { label: 'Job Matches', value: matches.length, icon: '💼', color: 'from-purple-500 to-purple-600', link: '/jobs' },
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          <div className="relative z-10">
            <p className="text-blue-100 text-sm font-medium">{greeting}</p>
            <h1 className="text-3xl font-bold mt-1">{user?.profile?.name || 'Developer'}</h1>
            <p className="mt-2 text-blue-100 max-w-lg">
              {progressStats?.currentStreak 
                ? `Amazing! You're on a ${progressStats.currentStreak}-day learning streak. Keep pushing forward!`
                : 'Ready to level up your skills today? Let\'s make progress together.'}
            </p>
            <div className="flex gap-3 mt-6">
              <Link to="/learning" className="bg-white text-blue-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                Continue Learning
              </Link>
              <Link to="/interview" className="bg-white/20 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-white/30 transition-colors">
                Practice Interview
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Link 
              key={stat.label} 
              to={stat.link}
              className="group bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl">{stat.icon}</span>
                <div className={`bg-gradient-to-r ${stat.color} text-white text-sm font-bold px-3 py-1 rounded-full`}>
                  {stat.value}
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {stat.label}
              </p>
            </Link>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Learning Progress */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Learning Path</h2>
                <Link to="/learning" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All →</Link>
              </div>
            </div>
            <div className="p-6">
              {learningLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : roadmap?.milestones?.length ? (
                <div className="space-y-4">
                  {roadmap.milestones.slice(0, 4).map((milestone, idx) => (
                    <div key={milestone.id} className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        milestone.completed 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {milestone.completed ? '✓' : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${milestone.completed ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                          {milestone.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{milestone.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🎯</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Start Your Journey</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Create a personalized learning roadmap based on your goals</p>
                  <Link to="/learning" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                    Generate Roadmap
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tasks</h2>
                <Link to="/productivity" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All →</Link>
              </div>
            </div>
            <div className="p-6">
              {tasksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : pendingTasks.length ? (
                <div className="space-y-3">
                  {pendingTasks.map((task) => (
                    <div key={task.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{task.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          task.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                          task.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                          'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        }`}>{task.priority}</span>
                        <span className="text-xs text-gray-500">{task.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <span className="text-3xl">📋</span>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">No pending tasks</p>
                  <Link to="/productivity" className="text-blue-600 text-sm font-medium hover:underline mt-1 inline-block">Add a task</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Job Matches */}
        {topMatches.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Job Matches</h2>
                <Link to="/jobs" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All →</Link>
              </div>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                {topMatches.map((job) => (
                  <div key={job.id} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{job.jobTitle}</h3>
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">
                        {job.matchScore}%
                      </span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{job.company}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '📚', label: 'Learning', desc: 'Continue your path', link: '/learning', color: 'hover:border-blue-500' },
            { icon: '💼', label: 'Interview', desc: 'Practice questions', link: '/interview', color: 'hover:border-purple-500' },
            { icon: '🚀', label: 'Projects', desc: 'Build something', link: '/projects', color: 'hover:border-green-500' },
            { icon: '🎯', label: 'Jobs', desc: 'Find opportunities', link: '/jobs', color: 'hover:border-orange-500' },
          ].map((action) => (
            <Link
              key={action.label}
              to={action.link}
              className={`bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border-2 border-transparent ${action.color} transition-all duration-300 hover:shadow-md group`}
            >
              <span className="text-3xl block mb-3">{action.icon}</span>
              <h3 className="font-semibold text-gray-900 dark:text-white">{action.label}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
