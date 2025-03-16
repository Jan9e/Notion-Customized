import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Settings,
  Search,
  Menu,
  X,
  LogOut
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(true)


  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} bg-gray-50 border-r border-gray-200 transition-all duration-300 overflow-hidden flex flex-col`}>
        {/* Workspace Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <button 
              className="text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            >
              {isWorkspaceMenuOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            <span className="font-medium text-sm">My Workspace</span>
            <button className="text-gray-600 hover:text-gray-900 transition-colors">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Workspace Pages */}
        {isWorkspaceMenuOpen && (
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {/* Sample pages - you'll make this dynamic later */}
              <button className="w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-200 transition-colors">
                Getting Started
              </button>
              <button className="w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-200 transition-colors">
                Project Ideas
              </button>
              <button className="w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-200 transition-colors">
                Tasks
              </button>
            </div>
          </div>
        )}

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {user?.name?.charAt(0)}
                </span>
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">{user?.name}</div>
                <div className="text-gray-500 text-xs">{user?.email}</div>
              </div>
            </div>
            <button 
              onClick={logout}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                className="pl-10 pr-4 py-1.5 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
              />
            </div>
          </div>
          <button className="text-gray-600 hover:text-gray-900 transition-colors">
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-white p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Welcome to Your Workspace</h1>
            <div className="prose prose-gray max-w-none">
              <p className="text-lg text-gray-600">
                This is your new Notion-like workspace. Start by creating pages and organizing your thoughts.
              </p>
              <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="p-6 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                  <h3 className="text-lg font-semibold mb-2">Create a new page</h3>
                  <p className="text-gray-600">Start writing and organizing your thoughts in a new page.</p>
                </div>
                <div className="p-6 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                  <h3 className="text-lg font-semibold mb-2">Import data</h3>
                  <p className="text-gray-600">Import your existing notes and documents.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}