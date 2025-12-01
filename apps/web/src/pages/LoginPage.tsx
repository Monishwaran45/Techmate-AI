import { LoginForm } from '../components/auth';
import { Link } from 'react-router-dom';

export function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white">
        <div>
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-2xl">🚀</span>
            </div>
            <span className="text-2xl font-bold">TechMate AI</span>
          </Link>
        </div>
        
        <div className="space-y-8">
          <h1 className="text-4xl font-bold leading-tight">
            Your AI-Powered<br />Career Companion
          </h1>
          <p className="text-lg text-blue-200 max-w-md">
            Personalized learning paths, interview prep, project ideas, and job matching — all powered by AI.
          </p>
          
          <div className="space-y-4">
            {[
              { icon: '📚', text: 'Personalized learning roadmaps' },
              { icon: '💼', text: 'AI mock interviews with feedback' },
              { icon: '🚀', text: 'Project ideas tailored to your skills' },
              { icon: '🎯', text: 'Smart job matching' },
            ].map((feature) => (
              <div key={feature.text} className="flex items-center gap-3">
                <span className="text-xl">{feature.icon}</span>
                <span className="text-blue-100">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-300 text-sm">
          © 2025 TechMate AI. All rights reserved.
        </p>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="text-3xl">🚀</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">TechMate AI</span>
            </Link>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
