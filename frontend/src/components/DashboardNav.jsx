import { Link } from 'react-router-dom';
import { FileText, Target, Settings, Home, BarChart2 } from 'lucide-react';

export default function DashboardNav() {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <Link to="/" className="font-semibold text-xl text-gray-800 flex items-center">
          <span className="mr-2">📝</span> Notion Clone
        </Link>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Main
          </h2>
          <ul className="space-y-2">
            <li>
              <Link 
                to="/dashboard" 
                className="flex items-center text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors"
              >
                <Home size={18} className="mr-2" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                to="/goals" 
                className="flex items-center text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors"
              >
                <BarChart2 size={18} className="mr-2" />
                Goal Dashboard
              </Link>
            </li>
            <li>
              <Link 
                to="/goal-demo" 
                className="flex items-center bg-blue-50 text-blue-600 px-3 py-2 rounded-md transition-colors"
              >
                <Target size={18} className="mr-2" />
                Goal Demo
              </Link>
            </li>
          </ul>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Pages
          </h2>
          <ul className="space-y-2">
            <li>
              <Link 
                to="/dashboard/page/sample-page" 
                className="flex items-center text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors"
              >
                <FileText size={18} className="mr-2" />
                Sample Page
              </Link>
            </li>
            <li>
              <Link 
                to="/dashboard/new" 
                className="flex items-center text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors"
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-200 text-gray-600 mr-2">+</span>
                New Page
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <Link 
          to="/settings" 
          className="flex items-center text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors"
        >
          <Settings size={18} className="mr-2" />
          Settings
        </Link>
      </div>
    </div>
  );
} 