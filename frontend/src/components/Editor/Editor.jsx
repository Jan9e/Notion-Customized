import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import Mention from '@tiptap/extension-mention'
import { useEffect, useState, useRef, useCallback } from 'react'
import tippy from 'tippy.js'
import './Editor.css'
import { debounce } from 'lodash'
import { api } from '../../lib/api'

// Define our slash commands with icons
const slashCommands = [
  {
    id: 'paragraph',
    label: 'Text',
    description: 'Just start writing with plain text',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-text"><path d="M17.5 10H6.5"/><path d="M6 14L8 14"/><path d="M12.5 14L16.5 14"/><path d="M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z"/></svg>',
    action: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setParagraph()
        .run()
    },
  },
  {
    id: 'heading1',
    label: 'Heading 1',
    description: 'Large section heading',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heading-1"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="m17 12 3-2v8"/></svg>',
    action: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setHeading({ level: 1 })
        .run()
    },
  },
  {
    id: 'heading2',
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heading-2"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"/></svg>',
    action: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setHeading({ level: 2 })
        .run()
    },
  },
  {
    id: 'heading3',
    label: 'Heading 3',
    description: 'Small section heading',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heading-3"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2"/><path d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2"/></svg>',
    action: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setHeading({ level: 3 })
        .run()
    },
  },
  {
    id: 'bulletList',
    label: 'Bullet List',
    description: 'Create a bullet list (use Tab to nest)',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>',
    action: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleBulletList()
        .run()
    },
  },
  {
    id: 'orderedList',
    label: 'Numbered List',
    description: 'Create a numbered list (use Tab to nest)',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-ordered"><line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>',
    action: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleOrderedList()
        .run()
    },
  },
  {
    id: 'codeBlock',
    label: 'Code Block',
    description: 'Add a code block',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
    action: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setCodeBlock()
        .run()
    },
  },
  {
    id: 'blockquote',
    label: 'Quote',
    description: 'Add a quote block',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-quote"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>',
    action: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent('<blockquote><p>' + (editor.state.selection.empty ? '' : editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)) + '</p></blockquote>')
        .run()
    },
  },
  {
    id: 'taskList',
    label: 'Task List',
    description: 'Add a task list',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-square"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    action: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleTaskList()
        .run()
    },
  },
]

const Editor = ({ content = '', onUpdate = () => {}, pageId }) => {
  const [showSlashCommands, setShowSlashCommands] = useState(false)
  const [slashCommandsPosition, setSlashCommandsPosition] = useState(null)
  const [slashCommandsRange, setSlashCommandsRange] = useState(null)
  const menuRef = useRef(null)
  const editorRef = useRef(null)
  const [showPopup, setShowPopup] = useState(false)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState(null)

  const handleSlashCommand = (command, range) => {
    if (command && command.action && editor) {
      // If we have a valid range, delete the slash character first
      if (range) {
        editor.chain().focus().deleteRange({
          from: range.from - 1, // Start from the slash character position
          to: range.from         // End at the current position
        }).run()
      }
      command.action({ editor, range })
      setShowSlashCommands(false)
    }
  }

  // Create a debounced save function
  const debouncedSave = useCallback(
    debounce(async (pageId, updates) => {
      try {
        setIsSaving(true);
        await api.updatePage(pageId, updates);
        setLastSavedAt(new Date());
      } catch (error) {
        console.error('Failed to save page:', error);
      } finally {
        setIsSaving(false);
      }
    }, 1000),
    []
  );

  // Handle content updates
  const handleUpdate = useCallback(({ editor }) => {
    const content = editor.getHTML();
    onUpdate(content);
    
    if (pageId) {
      debouncedSave(pageId, { content });
    }
  }, [onUpdate, pageId, debouncedSave]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: true,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: true,
        },
        blockquote: {
          HTMLAttributes: {
            class: 'custom-blockquote',
          },
        },
      }),
      Placeholder.configure({
        placeholder: 'Press / for commands...',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'editor-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Underline,
      Strike,
    ],
    content,
    onUpdate: handleUpdate,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
        spellcheck: 'false',
      },
      handleKeyDown: (view, event) => {
        const { key, target } = event

        if (key === '/') {
          // Show the popup
          setShowSlashCommands(true)
          // Calculate position based on cursor position
          const { selection } = view.state
          const { $from } = selection
          
          // Calculate the current cursor position in document coordinates
          const coords = view.coordsAtPos($from.pos)
          
          setSlashCommandsPosition({
            left: coords.left,
            top: coords.bottom + 5, // Position right below cursor with small offset
          })
          
          // Store the range to delete the slash later
          setSlashCommandsRange({
            from: $from.pos,
            to: $from.pos
          })
          
          return false
        } else if (key === ' ') {
          // Hide the popup if space is pressed after /
          if (showSlashCommands) {
            setShowSlashCommands(false)
            return true
          }
        }

        // Handle Tab key for list indentation
        if (key === 'Tab') {
          const { editor } = view
          
          if (!editor) return false
          
          // If in a list, prevent default tab behavior and handle indentation
          if (editor.isActive('bulletList') || editor.isActive('orderedList')) {
            event.preventDefault()
            
            if (event.shiftKey) {
              // Shift+Tab: Decrease indent (lift)
              editor.chain().focus().liftListItem('listItem').run()
            } else {
              // Tab: Increase indent (sink)
              editor.chain().focus().sinkListItem('listItem').run()
            }
            return true
          }
          
          return false
        }
        
        if (key === 'Escape' && showSlashCommands) {
          setShowSlashCommands(false)
          return true
        }
        
        return false
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '<p></p>')
    }
  }, [content, editor])

  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          editorRef.current && editorRef.current.contains(event.target)) {
        setShowSlashCommands(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuRef, editorRef])

  if (!editor) {
    return null
  }

  return (
    <div className="editor-container">
      {editor && (
        <BubbleMenu 
          className="bubble-menu" 
          tippyOptions={{ 
            duration: 100,
            animation: 'fade',
            placement: 'top',
            arrow: false,
            offset: [0, 10]
          }} 
          editor={editor}
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`bubble-menu-button ${editor.isActive('bold') ? 'is-active' : ''}`}
            title="Bold (Ctrl+B)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`bubble-menu-button ${editor.isActive('italic') ? 'is-active' : ''}`}
            title="Italic (Ctrl+I)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`bubble-menu-button ${editor.isActive('underline') ? 'is-active' : ''}`}
            title="Underline (Ctrl+U)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`bubble-menu-button ${editor.isActive('strike') ? 'is-active' : ''}`}
            title="Strikethrough"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="5" y1="12" x2="19" y2="12"/><path d="M16 6C16 6 14.5 4 12 4C9.5 4 7 6 7 8C7 10 9 11 12 11"/><path d="M12 13C15 13 17 14 17 16C17 18 14.5 20 12 20C9.5 20 8 18 8 18"/></svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`bubble-menu-button ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
            title="Heading 1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="m17 12 3-2v8"/></svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`bubble-menu-button ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
            title="Heading 2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"/></svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`bubble-menu-button ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
            title="Heading 3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2"/><path d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2"/></svg>
          </button>
        </BubbleMenu>
      )}
      
      <EditorContent editor={editor} className="editor-content" ref={editorRef} />
      
      {/* Slash commands popup */}
      {showSlashCommands && slashCommandsPosition && (
        <div 
          ref={menuRef}
          className="slash-command-list absolute"
          style={{
            left: `${slashCommandsPosition.left}px`,
            top: `${slashCommandsPosition.top}px`,
            zIndex: 9999,
          }}
        >
          <div className="slash-command-header">Basic blocks</div>
          <div className="slash-command-items">
            {slashCommands.map((command, index) => (
              <button
                key={command.id}
                className="slash-command-item"
                onClick={() => handleSlashCommand(command, slashCommandsRange)}
              >
                <div className="slash-command-item-icon" dangerouslySetInnerHTML={{ __html: command.icon }} />
                <div className="slash-command-item-content">
                  <div className="slash-command-item-title">{command.label}</div>
                  <div className="slash-command-item-description">{command.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Add keyboard shortcut info */}
      <div className="editor-shortcuts-info">
        <p>Tip: Use <kbd>Tab</kbd> to indent list items and <kbd>Shift+Tab</kbd> to unindent</p>
      </div>
      
      {/* Temporary test button for lists */}
      <div className="fixed bottom-4 right-4 flex gap-2">
        <button 
          className="bg-green-500 text-white p-2 rounded shadow-lg hover:bg-green-600 transition-colors text-xs"
          onClick={() => editor && editor.commands.toggleBulletList()}
          title="Test Bullet List"
        >
          Bullet List
        </button>
        <button 
          className="bg-blue-500 text-white p-2 rounded shadow-lg hover:bg-blue-600 transition-colors text-xs"
          onClick={() => editor && editor.commands.toggleOrderedList()}
          title="Test Numbered List"
        >
          Numbered List
        </button>
      </div>
    </div>
  )
}

export default Editor 