import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  File,
  X,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { api } from '../../lib/api'
import TreeItem from './TreeItem'

export default function Sidebar({ workspaceId, onCloseMobile, isCollapsed, onToggleCollapse }) {
  const navigate = useNavigate()
  const [workspace, setWorkspace] = useState(null)
  const [pages, setPages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadWorkspaceContent()
    loadWorkspaceDetails()
  }, [workspaceId])

  const loadWorkspaceDetails = async () => {
    try {
      const data = await api.getWorkspace(workspaceId)
      setWorkspace(data)
    } catch (error) {
      console.error('Error loading workspace details:', error)
      setError('Failed to load workspace details')
    }
  }

  const loadWorkspaceContent = async () => {
    try {
      setIsLoading(true)
      const data = await api.getWorkspaceContent(workspaceId)
      setPages(data.pages || [])
    } catch (error) {
      console.error('Error loading workspace content:', error)
      setError(error.message || 'Failed to load workspace content')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePage = async () => {
    try {
      const newPage = await api.createPage({
        title: 'Untitled',
        workspaceId,
      })
      await loadWorkspaceContent()
      navigate(`/dashboard/page/${newPage.id}`)
      if (onCloseMobile) onCloseMobile()
    } catch (error) {
      console.error('Error creating page:', error)
      setError('Failed to create page')
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error: {error}
        <button
          onClick={loadWorkspaceContent}
          className="ml-2 text-sm text-blue-500 hover:text-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Workspace Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <h2 className="font-semibold text-gray-900 truncate">
            {workspace?.name || 'Workspace'}
          </h2>
        )}
        <div className="flex items-center space-x-2 ml-auto">
          {!isCollapsed && (
            <button
              onClick={handleCreatePage}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors duration-150 group"
              title="New page"
            >
              <Plus className="h-4 w-4 text-gray-600 group-hover:text-gray-900" />
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 hover:bg-gray-100 rounded-md hidden lg:block transition-colors duration-150 group"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronsRight className="h-4 w-4 text-gray-600 group-hover:text-gray-900" />
            ) : (
              <ChevronsLeft className="h-4 w-4 text-gray-600 group-hover:text-gray-900" />
            )}
          </button>
          <button
            onClick={onCloseMobile}
            className="p-1.5 hover:bg-gray-100 rounded-md lg:hidden transition-colors duration-150 group"
            title="Close sidebar"
          >
            <X className="h-4 w-4 text-gray-600 group-hover:text-gray-900" />
          </button>
        </div>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-2">
        {pages.map(page => (
          <TreeItem
            key={page.id}
            item={page}
            workspaceId={workspaceId}
            onRefresh={loadWorkspaceContent}
            onCloseMobile={onCloseMobile}
          />
        ))}
      </div>
    </div>
  )
} 