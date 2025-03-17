import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import Editor from '../components/Editor/Editor'
import { Loader2 } from 'lucide-react'

export default function PageEditor() {
  const { pageId } = useParams()
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveTimeout, setSaveTimeout] = useState(null)

  useEffect(() => {
    loadPage()
  }, [pageId])

  const loadPage = async () => {
    try {
      setLoading(true)
      const pageData = await api.getPage(pageId)
      setPage(pageData)
      setError(null)
    } catch (err) {
      console.error('Error loading page:', err)
      setError('Failed to load page')
    } finally {
      setLoading(false)
    }
  }

  const handleTitleChange = (e) => {
    const newTitle = e.target.value
    setPage(prev => ({ ...prev, title: newTitle }))
    
    // Debounce save
    if (saveTimeout) clearTimeout(saveTimeout)
    const timeout = setTimeout(() => updatePage({ title: newTitle }), 1000)
    setSaveTimeout(timeout)
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
      setSaving(true)
      await api.updatePage(pageId, updates)
      setSaving(false)
    } catch (err) {
      console.error('Error saving page:', err)
      alert('Failed to save changes')
      setSaving(false)
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
          onChange={handleContentChange}
        />
      </div>
    </div>
  )
} 