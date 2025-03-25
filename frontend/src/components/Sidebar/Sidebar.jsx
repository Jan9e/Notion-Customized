import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  File,
  X,
  ChevronsLeft,
  ChevronsRight,
  Star,
  Archive,
} from 'lucide-react'
import { api } from '../../lib/api'
import TreeItem from './TreeItem'
import { usePage } from '../../contexts/PageContext'

export default function Sidebar({ workspaceId, onCloseMobile, isCollapsed, onToggleCollapse }) {
  const navigate = useNavigate()
  const [workspace, setWorkspace] = useState(null)
  const [pages, setPages] = useState([])
  const [favorites, setFavorites] = useState([])
  const [showArchived, setShowArchived] = useState(false)
  const [archivedPages, setArchivedPages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const { setRefreshWorkspace } = usePage()
  const [isCreatingPage, setIsCreatingPage] = useState(false)

  // Move loadWorkspaceContent definition before useEffect and memoize it
  const loadWorkspaceContent = useCallback(async () => {
    try {
      setIsLoading(true)
      const { pages } = await api.getWorkspaceContent(workspaceId)
      
      if (!pages) {
        setPages([])
        setFavorites([])
        return
      }
      
      // Separate favorites and regular pages
      const favs = pages.filter(page => page.isFavorite)
      const regular = buildPageTree(pages.filter(page => !page.isFavorite && !page.isArchived))
      
      setFavorites(favs)
      setPages(regular)
    } catch (error) {
      console.error('Error loading workspace content:', error)
      setError(error.message || 'Failed to load workspace content')
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId])

  // Define loadWorkspaceDetails with useCallback as well
  const loadWorkspaceDetails = useCallback(async () => {
    try {
      const data = await api.getWorkspace(workspaceId)
      setWorkspace(data)
    } catch (error) {
      console.error('Error loading workspace details:', error)
      setError('Failed to load workspace details')
    }
  }, [workspaceId])

  useEffect(() => {
    loadWorkspaceContent()
    loadWorkspaceDetails()
  }, [loadWorkspaceContent, loadWorkspaceDetails])

  useEffect(() => {
    if (showArchived && workspaceId) {
      fetchArchivedPages()
    }
  }, [showArchived, workspaceId])

  useEffect(() => {
    setRefreshWorkspace(() => loadWorkspaceContent)
  }, [setRefreshWorkspace, loadWorkspaceContent])

  const fetchArchivedPages = async () => {
    try {
      const { pages } = await api.getArchivedPages(workspaceId)
      setArchivedPages(pages || [])
    } catch (error) {
      console.error('Error fetching archived pages:', error)
      setArchivedPages([])
    }
  }

  // Build tree structure from flat array of pages
  const buildPageTree = (flatPages) => {
    const pageMap = {}
    const tree = []

    // First pass: create page map
    flatPages.forEach(page => {
      pageMap[page.id] = { ...page, children: [] }
    })

    // Second pass: build tree structure
    flatPages.forEach(page => {
      const node = pageMap[page.id]
      if (page.parentId && pageMap[page.parentId]) {
        pageMap[page.parentId].children.push(node)
      } else {
        tree.push(node)
      }
    })

    // Sort tree and children by order
    const sortByOrder = (a, b) => a.order - b.order
    tree.sort(sortByOrder)
    Object.values(pageMap).forEach(page => {
      page.children.sort(sortByOrder)
    })

    return tree
  }

  // Define a new function to handle the "New Page" button click
  const handleNewPage = () => {
    // Navigate to template selection view
    navigate('/dashboard/new')
    // Close mobile sidebar if needed
    onCloseMobile?.()
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
              onClick={handleNewPage}
              disabled={isCreatingPage}
              className={`
                p-1.5 hover:bg-gray-100 rounded-md transition-colors duration-150 group
                ${isCreatingPage ? 'opacity-50 cursor-not-allowed' : ''}
              `}
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
        {/* Favorites section */}
        {favorites.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center px-2 py-1 text-sm font-medium text-gray-500">
              <Star className="h-4 w-4 mr-1" />
              Favorites
            </div>
            <div>
              {favorites.map(page => (
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
        )}

        {/* Regular pages section */}
        <div className="mb-4">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-sm font-medium text-gray-500">Pages</span>
            <button
              onClick={handleNewPage}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Create new page"
            >
              <Plus className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          <div>
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

        {/* Archive section */}
        <div>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="w-full flex items-center px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded transition-colors"
          >
            <Archive className="h-4 w-4 mr-1" />
            Archive
          </button>
          {showArchived && (
            <div className="mt-1">
              {archivedPages.map(page => (
                <TreeItem
                  key={page.id}
                  item={page}
                  workspaceId={workspaceId}
                  onRefresh={() => {
                    loadWorkspaceContent()
                    fetchArchivedPages()
                  }}
                  onCloseMobile={onCloseMobile}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 