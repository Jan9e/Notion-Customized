import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  File,
  Edit,
  Trash,
  X,
} from 'lucide-react'
import { api } from '../../lib/api'
import { usePage } from '../../contexts/PageContext'

export default function TreeItem({ 
  item, 
  workspaceId,
  onRefresh, 
  onCloseMobile 
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isEditing, setIsEditing] = useState(false)
  const [newTitle, setNewTitle] = useState(item.title)
  const inputRef = useRef(null)
  
  // Get the active page information from context
  const { activePageId, activePageTitle } = usePage()
  
  // Check if this item is the active page
  const isActive = activePageId === item.id
  
  // Use the active title from context if this is the active page
  const displayTitle = isActive ? activePageTitle : item.title

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])
  
  // Update local state when the item prop changes
  useEffect(() => {
    setNewTitle(item.title)
  }, [item.title])

  const handleClick = () => {
    navigate(`/dashboard/page/${item.id}`)
    if (onCloseMobile) onCloseMobile()
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this page?')) return

    try {
      await api.deletePage(item.id)
      if (location.pathname.includes(`/dashboard/page/${item.id}`)) {
        navigate('/dashboard')
      }
      onRefresh?.()
    } catch (error) {
      console.error('Error deleting page:', error)
      alert('Failed to delete page')
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    try {
      await api.updatePage(item.id, { title: newTitle })
      setIsEditing(false)
      onRefresh?.()
    } catch (error) {
      console.error('Error updating page:', error)
      alert('Failed to update page')
    }
  }

  return (
    <div
      className={`group flex items-center py-1 px-2 rounded-md hover:bg-gray-100 cursor-pointer relative ${
        isActive ? 'bg-gray-100' : ''
      }`}
      onClick={handleClick}
    >
      <File className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />

      {isEditing ? (
        <form onSubmit={handleEdit} className="flex-1">
          <input
            ref={inputRef}
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded"
            onBlur={() => setIsEditing(false)}
            onClick={(e) => e.stopPropagation()}
          />
        </form>
      ) : (
        <span className="flex-1 text-sm truncate">
          {displayTitle}
        </span>
      )}

      <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
        <button
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            setIsEditing(true)
          }}
          title="Rename"
        >
          <Edit className="h-3 w-3 text-gray-500" />
        </button>
        <button
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          onClick={handleDelete}
          title="Delete"
        >
          <Trash className="h-3 w-3 text-gray-500" />
        </button>
      </div>
    </div>
  )
} 