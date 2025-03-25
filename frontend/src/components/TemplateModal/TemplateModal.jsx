import { useState } from 'react'
import { pageTemplates } from '../../lib/templates'
import { X } from 'lucide-react'

export default function TemplateModal({ isOpen, onClose, onSelectTemplate }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  if (!isOpen) return null

  const filteredTemplates = pageTemplates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Choose a template</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Templates Grid */}
        <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredTemplates.map(template => (
            <button
              key={template.id}
              onClick={() => {
                setSelectedTemplate(template)
                onSelectTemplate(template)
                onClose()
              }}
              className={`
                p-4 border rounded-lg text-left hover:border-blue-500 transition-colors
                flex flex-col gap-2
                ${selectedTemplate?.id === template.id ? 'border-blue-500 ring-2 ring-blue-500' : ''}
              `}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 flex items-center justify-center text-gray-600"
                  dangerouslySetInnerHTML={{ __html: template.icon }}
                />
                <div>
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-sm text-gray-500">{template.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 