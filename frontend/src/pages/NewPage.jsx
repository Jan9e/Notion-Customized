import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { api } from '../lib/api'
import { pageTemplates } from '../lib/templates'
import { usePage } from '../contexts/PageContext'

export default function NewPage() {
  const navigate = useNavigate()
  const { workspace } = usePage()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState(null)

  const handleSelectTemplate = async (template = null) => {
    try {
      if (!workspace) {
        throw new Error('No workspace selected. Please try again.')
      }
      
      setIsCreating(true)
      setError(null)
      
      const newPage = await api.createPage({
        title: template ? template.name : 'Untitled',
        content: template ? template.content : '<p></p>',
        workspaceId: workspace,
      })
      
      navigate(`/dashboard/page/${newPage.id}`)
    } catch (error) {
      console.error('Error creating page:', error)
      setError(error.message || 'Failed to create page')
    } finally {
      setIsCreating(false)
    }
  }

  // Render error message if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create a new page</h1>
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create a new page</h1>
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Template Options - including the blank page from the templates array */}
          {pageTemplates.map(template => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              disabled={isCreating}
              className={`
                relative group p-6 bg-white border rounded-xl shadow-sm
                hover:shadow-md hover:border-blue-500 transition-all duration-200
                ${isCreating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-50 text-gray-600"
                  dangerouslySetInnerHTML={{ __html: template.icon }}
                />
                <div className="flex-1 text-left">
                  <h3 className="font-medium text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                </div>
                {isCreating && <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-xl">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 