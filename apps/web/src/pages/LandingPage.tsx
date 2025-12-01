import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-2xl">🚀</span>
            </div>
            <span className="text-2xl font-bold text-white">TechMate AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-white hover:text-blue-200 font-medium">
              Sign In
            </Link>
            <Link
              to="/signup"
              className="bg-white text-blue-600 px-5 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-blue-200 px-4 py-2 rounded-full text-sm mb-8">
            <span>✨</span>
            <span>AI-Powered Career Development Platform</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Your AI-Powered
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Tech Career </span>
            Companion
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Personalized learning paths, AI mock interviews, project ideas, and smart job matching — 
            everything you need to accelerate your tech career.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg shadow-white/20"
            >
              Start Free Trial
            </Link>
            <Link
              to="/login"
              className="bg-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              Watch Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white dark:bg-gray-900 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our AI-powered platform provides comprehensive tools to help you learn, practice, and land your dream job.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: '📚',
                title: 'Personalized Learning',
                description: 'AI-generated roadmaps tailored to your skills and career goals',
                color: 'from-blue-500 to-blue-600',
              },
              {
                icon: '💼',
                title: 'Mock Interviews',
                description: 'Practice with AI interviewers and get instant feedback',
                color: 'from-purple-500 to-purple-600',
              },
              {
                icon: '🚀',
                title: 'Project Ideas',
                description: 'Get project suggestions based on your skill level and interests',
                color: 'from-green-500 to-green-600',
              },
              {
                icon: '🎯',
                title: 'Job Matching',
                description: 'Smart job recommendations based on your profile and resume',
                color: 'from-orange-500 to-orange-600',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 hover:shadow-xl transition-shadow"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-2xl mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10K+', label: 'Active Users' },
              { value: '500+', label: 'Learning Paths' },
              { value: '95%', label: 'Success Rate' },
              { value: '24/7', label: 'AI Support' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</p>
                <p className="text-blue-100">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 dark:bg-gray-800 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Loved by Developers
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "TechMate AI helped me land my dream job at a FAANG company. The mock interviews were incredibly helpful!",
                author: 'Sarah Chen',
                role: 'Software Engineer at Google',
              },
              {
                quote: "The personalized learning roadmap saved me months of figuring out what to learn next. Highly recommended!",
                author: 'Marcus Johnson',
                role: 'Full Stack Developer',
              },
              {
                quote: "Best investment in my career. The AI feedback on my resume helped me get 3x more interview callbacks.",
                author: 'Emily Rodriguez',
                role: 'Frontend Developer at Meta',
              },
            ].map((testimonial) => (
              <div
                key={testimonial.author}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm"
              >
                <p className="text-gray-600 dark:text-gray-400 mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{testimonial.author}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-24">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Accelerate Your Career?
          </h2>
          <p className="text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of developers who are using TechMate AI to level up their skills and land their dream jobs.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-white text-blue-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-lg">🚀</span>
              </div>
              <span className="text-lg font-bold text-white">TechMate AI</span>
            </div>
            <p className="text-sm">© 2025 TechMate AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
