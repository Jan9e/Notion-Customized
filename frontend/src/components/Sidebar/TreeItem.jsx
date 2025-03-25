import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  File,
  Star,
  Trash2,
  Archive,
  MoreVertical,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { api } from '../../lib/api'
import { usePage } from '../../contexts/PageContext'

export default function TreeItem({ 
  item, 
  workspaceId,
  onRefresh, 
  onCloseMobile,
  depth = 0,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isOver, setIsOver] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  
  // Get the active page information from context
  const { activePageId, activePageTitle } = usePage()
  
  // Check if this item is the active page
  const isActive = activePageId === item.id
  
  // Use the active title from context if this is the active page
  const displayTitle = isActive ? activePageTitle : item.title

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClick = (e) => {
    e.stopPropagation()
    navigate(`/dashboard/page/${item.id}`)
    if (onCloseMobile) onCloseMobile()
  }

  const handleExpand = (e) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const handleDragStart = (e) => {
    e.stopPropagation()
    setIsDragging(true)
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id: item.id,
      parentId: item.parentId,
      order: item.order
    }))
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOver(true)
  }

  const handleDragLeave = () => {
    setIsOver(false)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOver(false)

    const draggedItem = JSON.parse(e.dataTransfer.getData('text/plain'))
    if (draggedItem.id === item.id) return // Can't drop on itself

    try {
      await api.movePage(draggedItem.id, {
        newParentId: item.id,
        newOrder: 0 // Place at the beginning of the children
      })
      onRefresh?.()
    } catch (error) {
      console.error('Error moving page:', error)
      alert('Failed to move page')
    }
  }

  const handleToggleFavorite = async (e) => {
    e.stopPropagation()
    try {
      await api.togglePageFavorite(item.id)
      onRefresh?.()
    } catch (error) {
      console.error('Error toggling favorite:', error)
      alert('Failed to toggle favorite')
    }
  }

  const handleRestore = async (e) => {
    e.stopPropagation()
    try {
      await api.restorePage(item.id)
      onRefresh?.()
    } catch (error) {
      console.error('Error restoring page:', error)
      alert('Failed to restore page')
    }
  }

  const handleArchive = async (e) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to archive this page?')) return

    try {
      await api.updatePage(item.id, { isArchived: true })
      if (location.pathname.includes(`/dashboard/page/${item.id}`)) {
        navigate('/dashboard')
      }
      onRefresh?.()
    } catch (error) {
      console.error('Error archiving page:', error)
      alert('Failed to archive page')
    }
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to permanently delete this page?')) return

    try {
      await api.permanentlyDeletePage(item.id)
      if (location.pathname.includes(`/dashboard/page/${item.id}`)) {
        navigate('/dashboard')
      }
      onRefresh?.()
    } catch (error) {
      console.error('Error deleting page:', error)
      alert('Failed to delete page')
    }
  }

  return (
    <>
      <div
        className={`
          group flex items-center py-1 px-2 rounded-md hover:bg-gray-100 cursor-pointer relative
          ${isDragging ? 'opacity-50' : ''}
          ${isOver ? 'bg-blue-50' : ''}
          ${location.pathname.includes(item.id) ? 'bg-gray-100' : ''}
        `}
        style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
        onClick={handleClick}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {item.children?.length > 0 && (
          <button
            onClick={handleExpand}
            className="p-1 hover:bg-gray-200 rounded transition-colors mr-1"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-gray-500" />
            ) : (
              <ChevronRight className="h-3 w-3 text-gray-500" />
            )}
          </button>
        )}
        
        <File className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
        
        <span className="flex-1 text-sm truncate">
          {displayTitle}
        </span>

        <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
          <button
            onClick={handleToggleFavorite}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star
              className={`h-3 w-3 ${item.isFavorite ? 'text-yellow-400 fill-current' : 'text-gray-500'}`}
            />
          </button>
          
          <button
            onClick={item.isArchived ? handleRestore : handleArchive}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title={item.isArchived ? "Restore from archive" : "Archive"}
          >
            <Archive 
              className={`h-3 w-3 ${item.isArchived ? 'text-blue-500' : 'text-gray-500'}`}
            />
          </button>
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowDropdown(!showDropdown)
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="More options"
            >
              <MoreVertical className="h-3 w-3 text-gray-500" />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-1 py-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                >
                  Delete permanently
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isExpanded && item.children?.length > 0 && (
        <div className="ml-4">
          {item.children.map(child => (
            <TreeItem
              key={child.id}
              item={child}
              workspaceId={workspaceId}
              onRefresh={onRefresh}
              onCloseMobile={onCloseMobile}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </>
  )
} 