import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import Editor from '../components/Editor/Editor'
import { Loader2 } from 'lucide-react'
import { usePage } from '../contexts/PageContext'
import { debounce } from 'lodash'

export default function PageEditor({ onRefresh }) {
  const { pageId } = useParams()
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveTimeout, setSaveTimeout] = useState(null)
  
  // Get the page context for real-time updates
  const { setActivePageId, setActivePageTitle, updateCurrentPage, refreshWorkspace } = usePage()

  // Create a debounced save function for the title
  const debouncedSaveTitle = useCallback(
    debounce(async (newTitle) => {
      try {
        setSaving(true);
        const updatedPage = await api.updatePage(pageId, { title: newTitle });
        setPage(updatedPage);
        setSaving(false);
      } catch (error) {
        console.error('Error saving title:', error);
        setSaving(false);
      }
    }, 1000),
    [pageId]
  );

  useEffect(() => {
    loadPage()
    
    // Set the active page ID when the component mounts or ID changes
    setActivePageId(pageId)
    
    // Cleanup when unmounting
    return () => {
      if (saveTimeout) clearTimeout(saveTimeout)
      setActivePageId(null)
      setActivePageTitle('')
    }
  }, [pageId])

  const loadPage = async () => {
    try {
      setLoading(true)
      const pageData = await api.getPage(pageId)
      setPage(pageData)
      
      // Update the page context with the loaded page
      updateCurrentPage(pageData)
      
      setError(null)
    } catch (err) {
      console.error('Error loading page:', err)
      setError('Failed to load page')
    } finally {
      setLoading(false)
    }
  }

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setPage(prev => ({ ...prev, title: newTitle }));
    
    // Update context once for immediate sidebar update
    updateCurrentPage({ ...page, title: newTitle });
    
    // Save the title with debounce (but don't update context again)
    debouncedSaveTitle(newTitle);
  }

  const handleContentChange = (newContent) => {
    setPage(prev => ({ ...prev, content: newContent }))
    
    // Debounce save
    if (saveTimeout) clearTimeout(saveTimeout)
    const timeout = setTimeout(() => updatePage({ content: newContent }), 1000)
    setSaveTimeout(timeout)
  }

  const updatePage = async (updates) => {
    try {
      setSaving(true);
      await api.updatePage(pageId, updates);
      setSaving(false);
    } catch (err) {
      console.error('Error saving page:', err);
      alert('Failed to save changes');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={page.title}
            onChange={handleTitleChange}
            className="text-3xl font-bold w-full bg-transparent border-none focus:outline-none focus:ring-0"
            placeholder="Untitled"
          />
          {saving && (
            <span className="text-sm text-gray-500">
              Saving...
            </span>
          )}
        </div>
        
        <Editor
          content={page.content}
          onUpdate={handleContentChange}
          pageId={pageId}
        />
      </div>
    </div>
  )
} 