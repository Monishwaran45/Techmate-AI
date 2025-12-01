import { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { createLazyComponent, preloadComponent } from './utils/lazyLoadUtils';

// Lazy load pages with retry mechanism for better reliability
const LoginPage = createLazyComponent(
  () => import(/* webpackChunkName: "login" */ './pages/LoginPage').then(m => ({ default: m.LoginPage })),
  { retries: 3 }
);
const SignupPage = createLazyComponent(
  () => import(/* webpackChunkName: "signup" */ './pages/SignupPage').then(m => ({ default: m.SignupPage })),
  { retries: 3 }
);
const ProfileSetupPage = createLazyComponent(
  () => import(/* webpackChunkName: "profile-setup" */ './pages/ProfileSetupPage').then(m => ({ default: m.ProfileSetupPage })),
  { retries: 3 }
);
const DashboardPage = createLazyComponent(
  () => import(/* webpackChunkName: "dashboard" */ './pages/DashboardPage').then(m => ({ default: m.DashboardPage })),
  { retries: 3 }
);
const LearningPage = createLazyComponent(
  () => import(/* webpackChunkName: "learning" */ './pages/LearningPage').then(m => ({ default: m.LearningPage })),
  { retries: 3 }
);
const ProductivityPage = createLazyComponent(
  () => import(/* webpackChunkName: "productivity" */ './pages/ProductivityPage').then(m => ({ default: m.ProductivityPage })),
  { retries: 3 }
);
const ProjectsPage = createLazyComponent(
  () => import(/* webpackChunkName: "projects" */ './pages/ProjectsPage').then(m => ({ default: m.ProjectsPage })),
  { retries: 3 }
);
const InterviewPage = createLazyComponent(
  () => import(/* webpackChunkName: "interview" */ './pages/InterviewPage').then(m => ({ default: m.InterviewPage })),
  { retries: 3 }
);
const JobsPage = createLazyComponent(
  () => import(/* webpackChunkName: "jobs" */ './pages/JobsPage').then(m => ({ default: m.JobsPage })),
  { retries: 3 }
);
const ProfilePage = createLazyComponent(
  () => import(/* webpackChunkName: "profile" */ './pages/ProfilePage').then(m => ({ default: m.ProfilePage })),
  { retries: 3 }
);

// Preload critical routes
const preloadDashboard = () => preloadComponent(() => import('./pages/DashboardPage'));
const preloadLogin = () => preloadComponent(() => import('./pages/LoginPage'));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

function App() {
  const user = useAuthStore((state) => state.user);

  // Preload critical routes based on auth state
  useEffect(() => {
    if (user) {
      // User is logged in, preload dashboard
      preloadDashboard();
    } else {
      // User is not logged in, preload login
      preloadLogin();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetupPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/learning" element={<ProtectedRoute><LearningPage /></ProtectedRoute>} />
          <Route path="/productivity" element={<ProtectedRoute><ProductivityPage /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
          <Route path="/interview" element={<ProtectedRoute><InterviewPage /></ProtectedRoute>} />
          <Route path="/jobs" element={<ProtectedRoute><JobsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </div>
  );
}

function HomePage() {
  const user = useAuthStore((state) => state.user);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <span className="text-2xl">🚀</span>
          </div>
          <span className="text-2xl font-bold text-white">TechMate AI</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/login" className="text-white hover:text-blue-200 font-medium transition-colors">Sign In</a>
          <a href="/signup" className="bg-white text-blue-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
            Get Started Free
          </a>
        </div>
      </nav>

      {/* Hero */}
      <div className="container mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 text-blue-200 px-4 py-2 rounded-full text-sm mb-8">
          <span>✨</span> AI-Powered Career Development Platform
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Accelerate Your<br />Tech Career with AI
        </h1>
        <p className="text-xl text-blue-200 max-w-2xl mx-auto mb-10">
          Personalized learning paths, AI mock interviews, project recommendations, and smart job matching — all in one platform.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a href="/signup" className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg">
            Start Free Today
          </a>
          <a href="/login" className="bg-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-colors">
            Sign In
          </a>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: '📚', title: 'Smart Learning', desc: 'AI-generated roadmaps tailored to your goals and skill level' },
            { icon: '💼', title: 'Interview Prep', desc: 'Practice with AI interviewers and get instant feedback' },
            { icon: '🚀', title: 'Project Ideas', desc: 'Get project suggestions based on your skills and interests' },
            { icon: '🎯', title: 'Job Matching', desc: 'Find opportunities that match your profile perfectly' },
          ].map((feature) => (
            <div key={feature.title} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
              <span className="text-4xl mb-4 block">{feature.icon}</span>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-blue-200">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-white/10">
        <p className="text-center text-blue-300 text-sm">© 2025 TechMate AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default App;
