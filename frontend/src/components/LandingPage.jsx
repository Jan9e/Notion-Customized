import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="px-6 py-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img
              src="/notion-logo.png"
              alt="Notion Clone"
              className="h-8 w-auto"
            />
            <span className="font-bold text-xl">Notion Clone</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-md text-sm font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Your Workspace, Reimagined
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Write, plan, and get organized in one place. Welcome to your new digital home.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800"
          >
            Get Started for Free
          </Link>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 border border-gray-200 rounded-lg">
            <div className="text-2xl mb-4">📝</div>
            <h3 className="text-lg font-semibold mb-2">Notes & Docs</h3>
            <p className="text-gray-600">
              Simple, powerful, beautiful. Write and organize to your heart's content.
            </p>
          </div>
          <div className="p-6 border border-gray-200 rounded-lg">
            <div className="text-2xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold mb-2">Tasks & Projects</h3>
            <p className="text-gray-600">
              Stay on top of your goals with flexible project management tools.
            </p>
          </div>
          <div className="p-6 border border-gray-200 rounded-lg">
            <div className="text-2xl mb-4">🤝</div>
            <h3 className="text-lg font-semibold mb-2">Team Collaboration</h3>
            <p className="text-gray-600">
              Work together seamlessly with your team in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 