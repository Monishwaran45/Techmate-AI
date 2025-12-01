import { SignupForm } from '../components/auth';
import { Link } from 'react-router-dom';

export function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex">
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
            Start Your Tech<br />Journey Today
          </h1>
          <p className="text-lg text-purple-200 max-w-md">
            Join thousands of developers who are accelerating their careers with AI-powered guidance.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '10K+', label: 'Active Users' },
              { value: '500+', label: 'Learning Paths' },
              { value: '95%', label: 'Success Rate' },
              { value: '24/7', label: 'AI Support' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-purple-200 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-purple-300 text-sm">
          © 2025 TechMate AI. All rights reserved.
        </p>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="text-3xl">🚀</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">TechMate AI</span>
            </Link>
          </div>
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
