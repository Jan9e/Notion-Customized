import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Menu,
  X,
  Settings,
  Search,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from '../components/Sidebar/Sidebar'
import { api } from '../lib/api'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeWorkspace, setActiveWorkspace] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Set sidebar open by default on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true)
      } else {
        setIsSidebarOpen(false)
      }
    }

    // Set initial state
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!user) {
          console.log('No user found, skipping workspace load');
          return;
        }

        console.log('Loading workspace for user:', user);
        
        if (user.workspaces) {
          console.log('User workspaces:', JSON.stringify(user.workspaces, null, 2));
        } else {
          console.log('No workspaces array found on user object');
        }

        let workspace;
        if (!user.workspaces?.length) {
          console.log('No workspaces found, creating new workspace');
          workspace = await api.createWorkspace({
            name: 'My Workspace'
          });
          console.log('Created new workspace:', workspace);
        } else {
          const workspaceId = user.workspaces[0].id;
          console.log('Attempting to fetch workspace with ID:', workspaceId);
          
          const allWorkspaces = await api.getWorkspaces();
          console.log('All available workspaces:', allWorkspaces);
          
          workspace = await api.getWorkspace(workspaceId);
          console.log('Fetched workspace:', workspace);
        }
        
        if (!workspace) {
          throw new Error('Failed to load or create workspace');
        }
        
        setActiveWorkspace(workspace);
      } catch (error) {
        console.error('Error loading workspace:', error);
        setError(error.message);
        
        try {
          console.log('Attempting to create fallback workspace');
          const fallbackWorkspace = await api.createWorkspace({
            name: 'My Workspace'
          });
          console.log('Created fallback workspace:', fallbackWorkspace);
          setActiveWorkspace(fallbackWorkspace);
          setError(null);
        } catch (fallbackError) {
          console.error('Failed to create fallback workspace:', fallbackError);
          setError('Could not load or create workspace');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkspace();
  }, [user]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-red-500">
          Error: {error}
          <button
            onClick={() => window.location.reload()}
            className="ml-4 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex relative">
      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-64 bg-gray-50 border-r border-gray-200
          transform lg:transform-none
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-200 ease-in-out lg:transition-none
        `}
      >
        {activeWorkspace && (
          <>
            <Sidebar 
              workspaceId={activeWorkspace.id} 
              onCloseMobile={() => setIsSidebarOpen(false)}
            />
            {/* Debug info */}
            <div className="p-2 text-xs text-gray-500">
              Workspace ID: {activeWorkspace.id}
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Bar */}
        <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-600 hover:text-gray-900 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                className="pl-10 pr-4 py-1.5 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200 w-full sm:w-auto"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="text-gray-600 hover:text-gray-900">
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={logout}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-white p-4 sm:p-6 lg:p-8">
          {/* This will be replaced with the actual page content */}
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome to Your Workspace</h1>
            <p className="mt-4 text-gray-600">
              Select a page from the sidebar or create a new one to get started.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}