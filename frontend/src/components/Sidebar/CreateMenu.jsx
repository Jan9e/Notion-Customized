import { useState, useEffect, useRef } from 'react'
import { File, Folder } from 'lucide-react'

export default function CreateMenu({ position, onClose, onCreate }) {
  const [type, setType] = useState(null)
  const [name, setName] = useState('')
  const menuRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  useEffect(() => {
    if (type && inputRef.current) {
      inputRef.current.focus()
    }
  }, [type])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim() && type) {
      onCreate(type, name.trim())
      setName('')
      setType(null)
    }
  }

  return (
    <div
      ref={menuRef}
      className="absolute bg-white rounded-lg shadow-lg border border-gray-200 w-64 overflow-hidden"
      style={{
        top: position.y,
        left: position.x,
      }}
    >
      {!type ? (
        <div className="p-1">
          <button
            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            onClick={() => setType('page')}
          >
            <File className="h-4 w-4 mr-2" />
            New page
          </button>
          <button
            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            onClick={() => setType('folder')}
          >
            <Folder className="h-4 w-4 mr-2" />
            New folder
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-3">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === 'page' ? 'Page title...' : 'Folder name...'}
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
          <div className="flex justify-end mt-3 space-x-2">
            <button
              type="button"
              onClick={() => setType(null)}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-3 py-1 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </form>
      )}
    </div>
  )
} 