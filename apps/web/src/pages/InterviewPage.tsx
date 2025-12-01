import { useState, useEffect } from 'react';
import { AppShell } from '../components/layout';
import { useInterviewStore } from '../store/interviewStore';


const interviewTypes = [
  { id: 'behavioral', name: 'Behavioral', icon: '🗣️', description: 'STAR method & soft skills', color: 'from-blue-500 to-blue-600' },
  { id: 'dsa', name: 'Data Structures', icon: '💻', description: 'Algorithms & problem solving', color: 'from-purple-500 to-purple-600' },
  { id: 'system_design', name: 'System Design', icon: '🏗️', description: 'Architecture & scalability', color: 'from-orange-500 to-orange-600' },
];

const difficultyLevels = [
  { id: 'easy', name: 'Easy', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
  { id: 'medium', name: 'Medium', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
  { id: 'hard', name: 'Hard', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
];

export function InterviewPage() {
  const [activeTab, setActiveTab] = useState<'practice' | 'sessions' | 'tips'>('practice');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [starting, setStarting] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [, setShowFeedback] = useState(false);
  const {
    sessions,
    currentSession,
    practiceQuestions,
    loading,
    error,
    fetchSessions,
    startSession,
    getPracticeQuestions,
    submitAnswer,
  } = useInterviewStore();

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedType) {
      getPracticeQuestions(selectedType);
    }
  }, [selectedType]);

  const handleStartSession = async (type: 'dsa' | 'system_design' | 'behavioral') => {
    setStarting(true);
    try {
      await startSession(type);
      setSelectedType(type);
    } finally {
      setStarting(false);
    }
  };

  const handleSubmitAnswer = async (questionId: string) => {
    if (!currentAnswer.trim() || !currentSession) return;
    await submitAnswer(currentSession.id, questionId, currentAnswer);
    setCurrentAnswer('');
    setShowFeedback(true);
  };

  const recentSessions = sessions.slice(0, 5);
  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + (s.score || 0), 0) / sessions.length)
    : 0;
  const totalQuestions = sessions.reduce((acc, s) => acc + s.questions.length, 0);
  const highScores = sessions.filter(s => s.score && s.score >= 80).length;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Interview Preparation</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              AI-powered mock interviews with real-time feedback
            </p>
          </div>
          <div className="flex gap-2">
            {(['practice', 'sessions', 'tips'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {tab === 'practice' ? '🎯 Practice' : tab === 'sessions' ? '📊 History' : '💡 Tips'}
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
            { label: 'Sessions Completed', value: sessions.length, icon: '📝', color: 'from-blue-500 to-blue-600' },
            { label: 'Average Score', value: `${avgScore}%`, icon: '📊', color: 'from-green-500 to-green-600' },
            { label: 'Questions Practiced', value: totalQuestions, icon: '❓', color: 'from-purple-500 to-purple-600' },
            { label: 'High Scores (80%+)', value: highScores, icon: '🏆', color: 'from-yellow-500 to-orange-500' },
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

        {/* Practice Tab */}
        {activeTab === 'practice' && (
          <div className="space-y-6">
            {/* Interview Type Selection */}
            <div className="grid md:grid-cols-3 gap-4">
              {interviewTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleStartSession(type.id as any)}
                  disabled={starting}
                  className={`relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 ${
                    selectedType === type.id
                      ? 'bg-gradient-to-br ' + type.color + ' text-white shadow-xl scale-[1.02]'
                      : 'bg-white dark:bg-gray-800 hover:shadow-lg border border-gray-100 dark:border-gray-700'
                  }`}
                >
                  <div className="relative z-10">
                    <span className="text-4xl mb-4 block">{type.icon}</span>
                    <h3 className={`font-bold text-lg mb-1 ${selectedType === type.id ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {type.name}
                    </h3>
                    <p className={`text-sm ${selectedType === type.id ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                      {type.description}
                    </p>
                  </div>
                  {selectedType === type.id && (
                    <div className="absolute top-4 right-4 bg-white/20 rounded-full p-1">
                      <span className="text-white">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Difficulty Selection */}
            {selectedType && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Difficulty:</span>
                  <div className="flex gap-2">
                    {difficultyLevels.map((level) => (
                      <button
                        key={level.id}
                        onClick={() => setSelectedDifficulty(level.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedDifficulty === level.id
                            ? level.color + ' ring-2 ring-offset-2 ring-gray-300 dark:ring-gray-600'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {level.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Practice Questions */}
            {selectedType && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {interviewTypes.find(t => t.id === selectedType)?.name} Questions
                  </h2>
                </div>
                <div className="p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <p className="text-gray-500 dark:text-gray-400">Loading questions...</p>
                      </div>
                    </div>
                  ) : practiceQuestions.length > 0 ? (
                    <div className="space-y-6">
                      {practiceQuestions.slice(0, 5).map((question, index) => (
                        <div key={question.id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center font-bold text-sm">
                                {index + 1}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                question.difficulty === 'easy' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                question.difficulty === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              }`}>
                                {question.difficulty}
                              </span>
                            </div>
                          </div>
                          <p className="font-medium text-gray-900 dark:text-white mb-4">{question.content}</p>
                          <div className="space-y-3">
                            <textarea
                              value={currentAnswer}
                              onChange={(e) => setCurrentAnswer(e.target.value)}
                              placeholder="Type your answer here..."
                              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              rows={4}
                            />
                            <div className="flex justify-end gap-3">
                              <button className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium text-sm">
                                Skip
                              </button>
                              <button
                                onClick={() => handleSubmitAnswer(question.id)}
                                disabled={!currentAnswer.trim()}
                                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                              >
                                Submit Answer
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <span className="text-4xl mb-4 block">🎯</span>
                      <p className="text-gray-500 dark:text-gray-400">
                        Click on an interview type above to load practice questions
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Start */}
            {!selectedType && (
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-8 text-white text-center">
                <h2 className="text-2xl font-bold mb-3">Ready to Practice?</h2>
                <p className="text-purple-100 mb-6 max-w-md mx-auto">
                  Select an interview type above to start practicing with AI-generated questions
                </p>
                <div className="flex justify-center gap-4">
                  {interviewTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => handleStartSession(type.id as any)}
                      disabled={starting}
                      className="bg-white/20 hover:bg-white/30 px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                      {type.icon} {type.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}


        {/* Sessions History Tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            {recentSessions.length > 0 ? (
              <div className="space-y-4">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                          session.type === 'behavioral' ? 'bg-blue-100 dark:bg-blue-900/30' :
                          session.type === 'dsa' ? 'bg-purple-100 dark:bg-purple-900/30' :
                          'bg-orange-100 dark:bg-orange-900/30'
                        }`}>
                          {session.type === 'behavioral' ? '🗣️' : session.type === 'dsa' ? '💻' : '🏗️'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                            {session.type.replace('_', ' ')} Interview
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {session.questions.length} questions • {new Date(session.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className={`text-2xl font-bold ${
                            (session.score || 0) >= 80 ? 'text-green-600' :
                            (session.score || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {session.score || 0}%
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Score</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          session.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                          'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">📊</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Sessions Yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Complete your first mock interview to see your history</p>
                <button
                  onClick={() => setActiveTab('practice')}
                  className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-purple-700 transition-colors"
                >
                  Start Practicing →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tips Tab */}
        {activeTab === 'tips' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* STAR Method */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
                <span className="text-2xl">⭐</span> STAR Method
              </h3>
              <div className="space-y-4">
                {[
                  { letter: 'S', title: 'Situation', desc: 'Set the scene and give context' },
                  { letter: 'T', title: 'Task', desc: 'Describe your responsibility' },
                  { letter: 'A', title: 'Action', desc: 'Explain what you did' },
                  { letter: 'R', title: 'Result', desc: 'Share the outcome' },
                ].map((item) => (
                  <div key={item.letter} className="flex items-start gap-3">
                    <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center font-bold">
                      {item.letter}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General Tips */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
                <span className="text-2xl">💡</span> Pro Tips
              </h3>
              <div className="space-y-4">
                {[
                  { icon: '🎯', tip: 'Think out loud - share your thought process' },
                  { icon: '❓', tip: 'Ask clarifying questions before diving in' },
                  { icon: '📝', tip: 'Use examples from your real experience' },
                  { icon: '⏱️', tip: 'Practice with time constraints' },
                  { icon: '🔄', tip: 'Review and learn from feedback' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-xl">{item.icon}</span>
                    <p className="text-gray-700 dark:text-gray-300">{item.tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Interview Tips */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
                <span className="text-2xl">💻</span> Technical Interviews
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Understand the problem before coding</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Start with a brute force solution</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Optimize step by step</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Test with edge cases</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Analyze time & space complexity</span>
                </li>
              </ul>
            </div>

            {/* System Design Tips */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
                <span className="text-2xl">🏗️</span> System Design
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">1.</span>
                  <span>Clarify requirements & constraints</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">2.</span>
                  <span>Estimate scale (users, data, QPS)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">3.</span>
                  <span>Design high-level architecture</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">4.</span>
                  <span>Deep dive into components</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">5.</span>
                  <span>Address bottlenecks & trade-offs</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
