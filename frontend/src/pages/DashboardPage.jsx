import { useState, useEffect } from 'react'
import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import {
  Menu,
  X,
  Settings,
  Search,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { usePage } from '../contexts/PageContext'
import Sidebar from '../components/Sidebar/Sidebar'
import { api } from '../lib/api'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const { setWorkspace } = usePage()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeWorkspace, setActiveWorkspace] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [createAttempts, setCreateAttempts] = useState(0) // Track creation attempts

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
        
        if (!user.workspaces || user.workspaces.length === 0) {
          // No workspaces found, but we won't create one here - it should be created during signup
          throw new Error('No workspaces found. Please log out and sign up again.');
        }
        
        // Use the first workspace from the user object
        const workspaceId = user.workspaces[0].id;
        console.log('Attempting to fetch workspace with ID:', workspaceId);
        
        const workspace = await api.getWorkspace(workspaceId);
        console.log('Fetched workspace:', workspace);
        
        if (!workspace) {
          throw new Error('Failed to load workspace');
        }
        
        setActiveWorkspace(workspace);
        setWorkspace(workspace.id);
      } catch (error) {
        console.error('Error loading workspace:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkspace();
  }, [user, setWorkspace]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4">
        <div className="text-red-500 mb-4 text-center">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
        
        {error.toLowerCase().includes("workspace") && (
          <div className="mt-4">
            <p className="text-sm text-gray-700 mb-2">
              It looks like there might be an issue with your workspaces. 
              This can happen if the application created too many workspaces for your account.
            </p>
            <button
              onClick={async () => {
                try {
                  setIsLoading(true);
                  const result = await api.cleanupWorkspaces();
                  alert(`Cleaned up workspaces. ${result.message}`);
                  // Reload the page to refresh workspaces
                  window.location.reload();
                } catch (err) {
                  alert(`Failed to clean up workspaces: ${err.message}`);
                } finally {
                  setIsLoading(false);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
            >
              Clean Up Workspaces
            </button>
          </div>
        )}
        
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Retry
        </button>
      </div>
    );
  }

  const isPageRoute = location.pathname.includes('/dashboard/page/')

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
            {/* Add workspace cleanup button */}
            {error && error.includes("workspaces") && (
              <button
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const result = await api.cleanupWorkspaces();
                    alert(`Cleaned up workspaces. ${result.message}`);
                    // Reload the page to refresh workspaces
                    window.location.reload();
                  } catch (err) {
                    alert(`Failed to clean up workspaces: ${err.message}`);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="ml-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                title="Remove excess workspaces"
              >
                Fix Workspaces
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-white">
          {isPageRoute ? (
            <Outlet />
          ) : (
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome to Your Workspace</h1>
                <p className="mt-4 text-gray-600">
                  Select a page from the sidebar or create a new one to get started.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}