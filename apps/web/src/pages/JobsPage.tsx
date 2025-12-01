import { useState, useEffect, useRef } from 'react';
import { AppShell } from '../components/layout';
import { useJobsStore } from '../store/jobsStore';
import { useAuthStore } from '../store/authStore';

export function JobsPage() {
  const [activeTab, setActiveTab] = useState<'matches' | 'resume' | 'saved' | 'applications'>('matches');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [matchFilter, setMatchFilter] = useState<'all' | 'high' | 'medium'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const user = useAuthStore((state) => state.user);
  const {
    matches,
    resumes,
    loading,
    error,
    fetchMatches,
    fetchResumes,
    uploadResume,
    scoreResume,
    matchJobs,
  } = useJobsStore();

  useEffect(() => {
    fetchMatches();
    fetchResumes();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        await uploadResume(file);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleMatchJobs = async () => {
    const preferences = {
      skills: user?.profile?.skills || [],
      experience: user?.profile?.experience || 'entry',
      goals: user?.profile?.goals || [],
    };
    await matchJobs(preferences);
  };

  const handleAnalyzeResume = async (resumeId: string) => {
    setAnalyzing(true);
    try {
      await scoreResume(resumeId);
    } finally {
      setAnalyzing(false);
    }
  };

  const latestResume = resumes[resumes.length - 1];
  
  const filteredMatches = matchFilter === 'all' 
    ? matches 
    : matchFilter === 'high' 
      ? matches.filter(m => m.matchScore >= 80)
      : matches.filter(m => m.matchScore >= 60 && m.matchScore < 80);

  const highMatches = matches.filter(m => m.matchScore >= 80).length;
  const mediumMatches = matches.filter(m => m.matchScore >= 60 && m.matchScore < 80).length;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job Matching</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              AI-powered job recommendations based on your profile
            </p>
          </div>
          <div className="flex gap-2">
            {(['matches', 'resume', 'saved', 'applications'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {tab === 'matches' ? '🎯 Matches' : tab === 'resume' ? '📄 Resume' : tab === 'saved' ? '💾 Saved' : '📋 Applied'}
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
            { label: 'Total Matches', value: matches.length, icon: '🎯', color: 'from-blue-500 to-blue-600' },
            { label: 'High Match (80%+)', value: highMatches, icon: '🔥', color: 'from-green-500 to-green-600' },
            { label: 'Medium Match', value: mediumMatches, icon: '📊', color: 'from-yellow-500 to-orange-500' },
            { label: 'Resume Score', value: latestResume?.score?.overallScore || '-', icon: '📄', color: 'from-purple-500 to-purple-600' },
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

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div className="space-y-6">
            {/* Filters & Refresh */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Filter:</span>
                  <div className="flex gap-2">
                    {[
                      { id: 'all', label: 'All Matches' },
                      { id: 'high', label: '80%+ Match' },
                      { id: 'medium', label: '60-79%' },
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setMatchFilter(filter.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          matchFilter === filter.id
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleMatchJobs}
                  disabled={loading}
                  className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-5 py-2.5 rounded-xl font-medium hover:from-orange-700 hover:to-red-700 transition-all disabled:opacity-50 shadow-lg shadow-orange-600/25"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Finding...
                    </span>
                  ) : (
                    '🔄 Refresh Matches'
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                Matching based on: {user?.profile?.skills?.join(', ') || 'Update your profile for better matches'}
              </p>
            </div>

            {/* Job Listings */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Finding your perfect matches...</p>
                </div>
              </div>
            ) : filteredMatches.length > 0 ? (
              <div className="space-y-4">
                {filteredMatches.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-800 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                            💼
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-bold text-gray-900 dark:text-white text-lg">{job.jobTitle}</h3>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                                job.matchScore >= 90 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                job.matchScore >= 80 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                                job.matchScore >= 70 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                                'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              }`}>
                                {job.matchScore}% match
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-2">
                              {job.company} {job.location && `• ${job.location}`}
                            </p>
                            {job.salary && (
                              <p className="text-green-600 dark:text-green-400 font-semibold mb-3">{job.salary}</p>
                            )}
                            {job.matchReasons.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {job.matchReasons.slice(0, 4).map((reason, i) => (
                                  <span
                                    key={i}
                                    className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-lg"
                                  >
                                    ✓ {reason}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex lg:flex-col gap-2 lg:w-32">
                        {job.jobUrl && (
                          <a
                            href={job.jobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 lg:flex-none bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:from-orange-700 hover:to-red-700 transition-all text-center"
                          >
                            Apply Now
                          </a>
                        )}
                        <button className="flex-1 lg:flex-none border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          💾 Save
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🎯</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Find Your Perfect Job</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Upload your resume and update your profile to get personalized job matches
                </p>
                <button
                  onClick={handleMatchJobs}
                  className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 transition-all shadow-lg shadow-orange-600/25"
                >
                  🔍 Find Job Matches
                </button>
              </div>
            )}
          </div>
        )}


        {/* Resume Tab */}
        {activeTab === 'resume' && (
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload Resume</h2>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-orange-500 hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-all"
              >
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Uploading...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">📄</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">PDF, DOC, DOCX (max 5MB)</p>
                  </>
                )}
              </div>
            </div>

            {/* Resume Analysis */}
            {latestResume && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resume Analysis</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{latestResume.fileName}</p>
                    </div>
                    <button
                      onClick={() => handleAnalyzeResume(latestResume.id)}
                      disabled={analyzing}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                      {analyzing ? 'Analyzing...' : '🔍 Analyze Resume'}
                    </button>
                  </div>
                </div>

                {latestResume.score ? (
                  <div className="p-6">
                    {/* Score Overview */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {[
                        { label: 'Overall Score', value: latestResume.score.overallScore, color: 'text-blue-600' },
                        { label: 'ATS Compatibility', value: latestResume.score.atsCompatibility, color: 'text-green-600' },
                        { label: 'Content Quality', value: latestResume.score.contentQuality, color: 'text-purple-600' },
                      ].map((score) => (
                        <div key={score.label} className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <p className={`text-3xl font-bold ${score.color}`}>{score.value}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{score.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Score Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Overall Score</span>
                        <span className="font-medium text-gray-900 dark:text-white">{latestResume.score.overallScore}/100</span>
                      </div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            latestResume.score.overallScore >= 80 ? 'bg-green-500' :
                            latestResume.score.overallScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${latestResume.score.overallScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Suggestions */}
                    {latestResume.score.suggestions.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">💡 Improvement Suggestions</h3>
                        <div className="space-y-2">
                          {latestResume.score.suggestions.map((suggestion, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                              <span className="text-yellow-500 mt-0.5">⚡</span>
                              <p className="text-gray-700 dark:text-gray-300 text-sm">{suggestion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      Click "Analyze Resume" to get AI-powered feedback and suggestions
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Resume Tips */}
            <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl p-6 text-white">
              <h3 className="font-bold text-lg mb-4">📝 Resume Tips</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  'Use action verbs to describe achievements',
                  'Quantify results with numbers and metrics',
                  'Tailor your resume for each application',
                  'Keep it concise - 1-2 pages max',
                  'Include relevant keywords from job descriptions',
                  'Proofread for spelling and grammar errors',
                ].map((tip, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-orange-200">✓</span>
                    <span className="text-white/90 text-sm">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Saved Tab */}
        {activeTab === 'saved' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">💾</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Saved Jobs</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Save jobs you're interested in to review later</p>
            <button
              onClick={() => setActiveTab('matches')}
              className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-orange-700 transition-colors"
            >
              Browse Job Matches →
            </button>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📋</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Track Your Applications</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Keep track of jobs you've applied to</p>
            <button
              onClick={() => setActiveTab('matches')}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Find Jobs to Apply →
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
