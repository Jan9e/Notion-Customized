import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import CustomTableCell from './TableCell'
import TableHeader from '@tiptap/extension-table-header'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import Mention from '@tiptap/extension-mention'
import { useEffect, useState, useRef, useCallback } from 'react'
import tippy from 'tippy.js'
import './Editor.css'
import { debounce } from 'lodash'
import { api } from '../../lib/api'
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { findParentNode } from '@tiptap/core'
import { Decoration, DecorationSet } from 'prosemirror-view'

// Define the priority options with their styling
const priorityOptions = [
  { 
    value: 'High', 
    color: '#000000', 
    backgroundColor: '#ff3333' 
  },
  { 
    value: 'Medium', 
    color: '#000000', 
    backgroundColor: '#ff9500' 
  },
  { 
    value: 'Low', 
    color: '#000000', 
    backgroundColor: '#00cc44' 
  },
  { 
    value: 'Critical', 
    color: '#000000', 
    backgroundColor: '#cc33ff' 
  },
  { 
    value: 'Not Set', 
    color: '#000000', 
    backgroundColor: '#aaaaaa' 
  }
];

// Define the status options with their styling
const statusOptions = [
  { 
    value: 'Todo', 
    color: '#000000', 
    backgroundColor: '#E2E8F0' 
  },
  { 
    value: 'In Progress', 
    color: '#000000', 
    backgroundColor: '#BAE6FD' 
  },
  { 
    value: 'Blocked', 
    color: '#000000', 
    backgroundColor: '#FCA5A5' 
  },
  { 
    value: 'Done', 
    color: '#000000', 
    backgroundColor: '#BBF7D0' 
  },
  { 
    value: 'Not Started', 
    color: '#000000', 
    backgroundColor: '#E4E4E7' 
  }
];

// Create a custom extension for handling priority cells
const PriorityDropdown = Extension.create({
  name: 'priorityDropdown',

  addProseMirrorPlugins() {
    const plugin = new Plugin({
      key: new PluginKey('priorityDropdown'),
      props: {
        // This function enhances table cell rendering with priority styling
        decorations(state) {
          const { doc } = state;
          const decorations = [];
          
          // Helper function to safely find parent nodes
          const safelyFindParentNode = (predicate, $pos) => {
            try {
              if (!$pos) return null;
              
              // Manually look for the parent node
              for (let depth = $pos.depth; depth > 0; depth--) {
                const node = $pos.node(depth);
                const pos = $pos.before(depth);
                
                if (node && predicate(node)) {
                  return { node, pos, depth };
                }
              }
              return null;
            } catch (error) {
              console.warn('Error in safelyFindParentNode:', error);
              return null;
            }
          };
          
          doc.descendants((node, pos) => {
            if (node.type.name === 'tableCell') {
              try {
                // Skip header cells
                const $pos = state.doc.resolve(pos);
                
                // Safety check for $pos
                if (!$pos) return true;
                
                // Use our safer find parent function
                const table = safelyFindParentNode(n => n.type.name === 'table', $pos);
                const row = safelyFindParentNode(n => n.type.name === 'tableRow', $pos);
                
                // Safety check - if we can't find a table or row, skip this node
                if (!table || !row || !table.node || !row.node) return true;
                
                // Check if this cell is in the first row (header)
                if (!table.node.firstChild) return true;
                const isHeader = table.node.firstChild === row.node;
                if (isHeader) return true;
                
                // Get cell index to check if it's a priority column (4th column)
                let cellIndex = 0;
                let isPriorityCell = false;
                
                // Safely get the cell index
                try {
                  let currentPos = row.pos + 1; // Skip the row node start
                  let i = 0;
                  
                  row.node.forEach((cell, offset) => {
                    // If this position matches our cell's position, this is our index
                    if (pos === currentPos) {
                    cellIndex = i;
                  }
                    currentPos += cell.nodeSize;
                    i++;
                });
                } catch (cellIndexError) {
                  console.warn('Error getting cell index:', cellIndexError);
                  return true; // Skip this cell if we can't get its index
                }
                
                // Check if this is the priority column (4th column, index 3)
                if (cellIndex === 3) {
                  isPriorityCell = true;
                }
                
                if (!isPriorityCell) return true;
                
                // Extract priority from text content
                const textContent = node.textContent ? node.textContent.trim() : '';
                
                // Find the matching priority option - with safety check
                const priorityOption = priorityOptions.find(
                  option => option.value === textContent
                ) || priorityOptions.find(option => option.value === 'Not Set');
                
                if (priorityOption) {
                  // Create a decoration for the whole cell
                  decorations.push(
                    Decoration.node(pos, pos + node.nodeSize, {
                      class: `priority-cell`,
                      'data-priority': priorityOption.value,
                      'data-priority-color': priorityOption.color,
                      'data-priority-bg': priorityOption.backgroundColor,
                      style: `cursor: pointer !important; user-select: none !important; -webkit-user-modify: read-only !important; user-modify: read-only !important;`
                    })
                  );
                  
                  // Add a decoration to the paragraph to wrap text in a styled div
                  const textPos = pos + 1; // +1 to get inside the cell
                  if (node.firstChild && node.firstChild.type && node.firstChild.type.name === 'paragraph') {
                    const paraPos = textPos;
                    const paraSize = node.firstChild.nodeSize;
                    
                    // Replace the paragraph content with a styled wrapper
                    decorations.push(
                      Decoration.node(paraPos, paraPos + paraSize, {
                        class: 'priority-paragraph',
                        style: `display: flex; align-items: center; justify-content: center; margin: 0; min-height: 24px;`
                      })
                    );
                    
                    // If there's text content, wrap it in a styled span that looks like a tag
                    const firstChildText = node.firstChild.textContent ? node.firstChild.textContent.trim() : '';
                    if (firstChildText.length > 0) {
                      // Make sure we can safely access content props
                      if (node.firstChild.content && typeof node.firstChild.content.size !== 'undefined') {
                      const textNodePos = paraPos + 1; // +1 to get inside the paragraph
                      const textNodeSize = node.firstChild.content.size;
                      
                      decorations.push(
                        Decoration.inline(textNodePos, textNodePos + textNodeSize, {
                            class: 'priority-tag-wrapper',
                            style: `
                              display: inline-block; 
                              padding: 3px 10px; 
                              border-radius: 4px; 
                              background-color: ${priorityOption.backgroundColor}; 
                              color: ${priorityOption.color}; 
                              font-size: 13px; 
                              font-weight: 600;
                              box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                              cursor: pointer;
                              pointer-events: auto !important;
                            `
                          })
                        );
                      }
                    }
                  }
                }
              } catch (error) {
                console.warn('Error decorating priority cell:', error);
                // Continue processing other nodes even if there's an error with this one
              }
            }
            
            return true;
          });
          
          return DecorationSet.create(state.doc, decorations);
        },
        
        handleClick(view, pos, event) {
          try {
            // Check if this is a priority cell by DOM class first (most reliable)
            const target = event.target;
            const cell = target.closest('td');
            if (!cell || !cell.classList.contains('priority-cell')) {
              return false;
            }
            
            console.log("PriorityDropdown click handler called (confirmed priority cell)", { pos });
            
            // Find the clicked node
            const { state } = view;
            const clickedNode = state.doc.nodeAt(pos);
            
            // If not in a table cell, return
            if (!clickedNode) return false;
            
            // Get current priority
            const currentPriority = (clickedNode.textContent && clickedNode.textContent.trim()) || "Not Set";
            
            console.log("Current priority:", currentPriority);
            
            // Get the cell position for dropdown placement
            const cellRect = cell.getBoundingClientRect();
            
            // Use the direct DOM approach to create the dropdown
            createDirectDomDropdown(
              'priority',
              priorityOptions,
              { 
                top: cellRect.bottom,
                left: cellRect.left,
                cellPos: pos // Pass the position for cell tracking
              },
              currentPriority,
              (selectedPriority) => {
                console.log("Priority selected:", selectedPriority);
                
                try {
                  // Get the precise cell position to work with
                  const $pos = state.doc.resolve(pos);
                  
                  // Find parent table cell node position
                  let depth = $pos.depth;
                  let cellPos = null;
                  
                  // Walk up the node hierarchy to find the table cell
                  while (depth > 0) {
                    const node = $pos.node(depth);
                    if (node.type.name === 'tableCell') {
                      cellPos = $pos.before(depth);
                      break;
                    }
                    depth--;
                  }
                  
                  if (!cellPos) {
                    console.error("Could not find table cell position");
                    return;
                  }
                  
                  // Create a transaction
                  const tr = state.tr;
                  
                  // Get cell node
                  const cellNode = state.doc.nodeAt(cellPos);
                  if (!cellNode) {
                    console.error("Could not find cell node");
                    return;
                  }
                  
                  // Create a new text node with selected priority
                  const textNode = state.schema.text(selectedPriority);
                  
                  // Create a paragraph to hold the text
                  const paragraph = state.schema.nodes.paragraph.create(null, textNode);
                  
                  // Directly replace all the content of the cell with our new content
                  const newCell = state.schema.nodes.tableCell.create(
                    cellNode.attrs,
                    paragraph
                  );
                  
                  // Replace the entire cell to ensure clean replacement
                  tr.replaceWith(cellPos, cellPos + cellNode.nodeSize, newCell);
                  
                  // Dispatch the transaction
                  view.dispatch(tr);
                  
                  // Also update the DOM directly for immediate feedback
                  // First get a reference to the cell DOM node again
                  const cellDOM = cell;
                  if (cellDOM) {
                    // Create a div to hold the content
                    const div = document.createElement('div');
                    
                    // Create a paragraph to match ProseMirror's structure
                    const p = document.createElement('p');
                    p.textContent = selectedPriority;
                    
                    // First clear the cell completely
                    while (cellDOM.firstChild) {
                      cellDOM.removeChild(cellDOM.firstChild);
                    }
                    
                    // Add the new structure
                    div.appendChild(p);
                    cellDOM.appendChild(div);
                    
                    // Visual feedback
                    cellDOM.style.transition = 'background-color 0.2s ease';
                    cellDOM.style.backgroundColor = 'rgba(35, 131, 226, 0.1)';
                    setTimeout(() => {
                      cellDOM.style.backgroundColor = '';
                    }, 300);
                  }
                } catch (error) {
                  console.error("Error updating priority:", error);
                }
              }
            );
            
            // Stop event propagation
            event.stopPropagation();
            event.preventDefault();
            return true;
          } catch (error) {
            console.error('Error in priority dropdown click handler:', error);
            return false;
          }
        },
      },
    });

    return [plugin];
  },
});

// Create a custom extension for handling status cells
const StatusDropdown = Extension.create({
  name: 'statusDropdown',

  addProseMirrorPlugins() {
    const plugin = new Plugin({
      key: new PluginKey('statusDropdown'),
      props: {
        // This function enhances table cell rendering with status styling
        decorations(state) {
          const { doc } = state;
          const decorations = [];
          
          // Helper function to safely find parent nodes
          const safelyFindParentNode = (predicate, $pos) => {
            try {
              if (!$pos) return null;
              
              // Manually look for the parent node
              for (let depth = $pos.depth; depth > 0; depth--) {
                const node = $pos.node(depth);
                const pos = $pos.before(depth);
                
                if (node && predicate(node)) {
                  return { node, pos, depth };
                }
              }
              return null;
            } catch (error) {
              console.warn('Error in safelyFindParentNode:', error);
              return null;
            }
          };
          
          doc.descendants((node, pos) => {
            if (node.type.name === 'tableCell') {
              try {
                // Skip header cells
                const $pos = state.doc.resolve(pos);
                
                // Safety check for $pos
                if (!$pos) return true;
                
                // Use our safer find parent function
                const table = safelyFindParentNode(n => n.type.name === 'table', $pos);
                const row = safelyFindParentNode(n => n.type.name === 'tableRow', $pos);
                
                // Safety check - if we can't find a table or row, skip this node
                if (!table || !row || !table.node || !row.node) return true;
                
                // Check if this cell is in the first row (header)
                if (!table.node.firstChild) return true;
                const isHeader = table.node.firstChild === row.node;
                if (isHeader) return true;
                
                // Get cell index to check if it's a status column (2nd column)
            let cellIndex = 0;
                let isStatusCell = false;
                
                // Safely get the cell index
                try {
                  let currentPos = row.pos + 1; // Skip the row node start
                  let i = 0;
                  
                  row.node.forEach((cell, offset) => {
                    // If this position matches our cell's position, this is our index
                    if (pos === currentPos) {
                cellIndex = i;
              }
                    currentPos += cell.nodeSize;
                    i++;
                  });
                } catch (cellIndexError) {
                  console.warn('Error getting cell index:', cellIndexError);
                  return true; // Skip this cell if we can't get its index
                }
                
                // Check if this is the status column (2nd column, index 1)
                if (cellIndex === 1) {
                  isStatusCell = true;
                }
                
                if (!isStatusCell) return true;
                
                // Extract status from text content
                const textContent = node.textContent ? node.textContent.trim() : '';
                
                // Find the matching status option - with safety check
                const statusOption = statusOptions.find(
                  option => option.value === textContent
                ) || statusOptions.find(option => option.value === 'Todo');
                
                if (statusOption) {
                  // Create a decoration for the whole cell
                  decorations.push(
                    Decoration.node(pos, pos + node.nodeSize, {
                      class: `status-cell`,
                      'data-status': statusOption.value,
                      'data-status-color': statusOption.color,
                      'data-status-bg': statusOption.backgroundColor,
                      style: `cursor: pointer !important; user-select: none !important; -webkit-user-modify: read-only !important; user-modify: read-only !important;`
                    })
                  );
                  
                  // Add a decoration to the paragraph to wrap text in a styled div
                  const textPos = pos + 1; // +1 to get inside the cell
                  if (node.firstChild && node.firstChild.type && node.firstChild.type.name === 'paragraph') {
                    const paraPos = textPos;
                    const paraSize = node.firstChild.nodeSize;
                    
                    // Replace the paragraph content with a styled wrapper
                    decorations.push(
                      Decoration.node(paraPos, paraPos + paraSize, {
                        class: 'status-paragraph',
                        style: `display: flex; align-items: center; justify-content: center; margin: 0; min-height: 24px;`
                      })
                    );
                    
                    // If there's text content, wrap it in a styled span that looks like a tag
                    const firstChildText = node.firstChild.textContent ? node.firstChild.textContent.trim() : '';
                    if (firstChildText.length > 0) {
                      // Make sure we can safely access content props
                      if (node.firstChild.content && typeof node.firstChild.content.size !== 'undefined') {
                        const textNodePos = paraPos + 1; // +1 to get inside the paragraph
                        const textNodeSize = node.firstChild.content.size;
                        
                        decorations.push(
                          Decoration.inline(textNodePos, textNodePos + textNodeSize, {
                            class: 'status-tag-wrapper',
                            style: `
                              display: inline-block; 
                              padding: 3px 10px; 
                              border-radius: 4px; 
                              background-color: ${statusOption.backgroundColor}; 
                              color: black; 
                              font-size: 13px; 
                              font-weight: 600;
                              box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                              cursor: pointer;
                              pointer-events: auto !important;
                            `
                          })
                        );
                      }
                    }
                  }
                }
              } catch (error) {
                console.warn('Error decorating status cell:', error);
                // Continue processing other nodes even if there's an error with this one
              }
            }
            
            return true;
          });
          
          return DecorationSet.create(state.doc, decorations);
        },
        
        handleClick(view, pos, event) {
          try {
            // Check if this is a status cell by DOM class first (most reliable)
            const target = event.target;
            const cell = target.closest('td');
            if (!cell || !cell.classList.contains('status-cell')) {
              return false;
            }
            
            console.log("StatusDropdown click handler called (confirmed status cell)", { pos });
            
            // Find the clicked node
            const { state } = view;
            const clickedNode = state.doc.nodeAt(pos);
            
            // If not in a table cell, return
            if (!clickedNode) return false;
            
            // Get current status
            const currentStatus = (clickedNode.textContent && clickedNode.textContent.trim()) || "Not Started";
            
            console.log("Current status:", currentStatus);
            
            // Get the cell position for dropdown placement
            const cellRect = cell.getBoundingClientRect();
            
            // Use the direct DOM approach to create the dropdown
            createDirectDomDropdown(
              'status',
              statusOptions,
              { 
                top: cellRect.bottom,
                left: cellRect.left,
                cellPos: pos // Pass the position for cell tracking
              },
              currentStatus,
              (selectedStatus) => {
                console.log("Status selected:", selectedStatus);
                
                try {
                  // Get the precise cell position to work with
                  const $pos = state.doc.resolve(pos);
                  
                  // Find parent table cell node position
                  let depth = $pos.depth;
                  let cellPos = null;
                  
                  // Walk up the node hierarchy to find the table cell
                  while (depth > 0) {
                    const node = $pos.node(depth);
                    if (node.type.name === 'tableCell') {
                      cellPos = $pos.before(depth);
                break;
              }
                    depth--;
                  }
                  
                  if (!cellPos) {
                    console.error("Could not find table cell position");
                    return;
                  }
                  
                  // Create a transaction
                  const tr = state.tr;
                  
                  // Get cell node
                  const cellNode = state.doc.nodeAt(cellPos);
                  if (!cellNode) {
                    console.error("Could not find cell node");
                    return;
                  }
                  
                  // Create a new text node with selected status
                  const textNode = state.schema.text(selectedStatus);
                  
                  // Create a paragraph to hold the text
                  const paragraph = state.schema.nodes.paragraph.create(null, textNode);
                  
                  // Directly replace all the content of the cell with our new content
                  const newCell = state.schema.nodes.tableCell.create(
                    cellNode.attrs,
                    paragraph
                  );
                  
                  // Replace the entire cell to ensure clean replacement
                  tr.replaceWith(cellPos, cellPos + cellNode.nodeSize, newCell);
                  
                  // Dispatch the transaction
                  view.dispatch(tr);
                  
                  // Also update the DOM directly for immediate feedback
                  // First get a reference to the cell DOM node again
                  const cellDOM = cell;
                  if (cellDOM) {
                    // Create a div to hold the content
                    const div = document.createElement('div');
                    
                    // Create a paragraph to match ProseMirror's structure
                    const p = document.createElement('p');
                    p.textContent = selectedStatus;
                    
                    // First clear the cell completely
                    while (cellDOM.firstChild) {
                      cellDOM.removeChild(cellDOM.firstChild);
                    }
                    
                    // Add the new structure
                    div.appendChild(p);
                    cellDOM.appendChild(div);
                    
                    // Visual feedback
                    cellDOM.style.transition = 'background-color 0.2s ease';
                    cellDOM.style.backgroundColor = 'rgba(35, 131, 226, 0.1)';
                    setTimeout(() => {
                      cellDOM.style.backgroundColor = '';
                    }, 300);
                  }
                } catch (error) {
                  console.error("Error updating status:", error);
                }
              }
            );
            
            // Stop event propagation
            event.stopPropagation();
            event.preventDefault();
            return true;
          } catch (error) {
            console.error('Error in status dropdown click handler:', error);
            return false;
          }
        },
      },
    });

    return [plugin];
  },
});

// Create a custom extension for handling due date cells
const DueDatePicker = Extension.create({
  name: 'dueDatePicker',

  addProseMirrorPlugins() {
    const plugin = new Plugin({
      key: new PluginKey('dueDatePicker'),
      props: {
        // This function enhances table cell rendering with due date styling
        decorations(state) {
          const { doc } = state;
          const decorations = [];
          
          // Helper function to safely find parent nodes
          const safelyFindParentNode = (predicate, $pos) => {
            try {
              if (!$pos) return null;
              
              // Manually look for the parent node
              for (let depth = $pos.depth; depth > 0; depth--) {
                const node = $pos.node(depth);
                const pos = $pos.before(depth);
                
                if (node && predicate(node)) {
                  return { node, pos, depth };
                }
              }
              return null;
            } catch (error) {
              console.warn('Error in safelyFindParentNode:', error);
              return null;
            }
          };
          
          doc.descendants((node, pos) => {
            if (node.type.name === 'tableCell') {
              try {
                // Skip header cells
                const $pos = state.doc.resolve(pos);
                
                // Safety check for $pos
                if (!$pos) return true;
                
                // Use our safer find parent function
                const table = safelyFindParentNode(n => n.type.name === 'table', $pos);
                const row = safelyFindParentNode(n => n.type.name === 'tableRow', $pos);
                
                // Safety check - if we can't find a table or row, skip this node
                if (!table || !row || !table.node || !row.node) return true;
                
                // Check if this cell is in the first row (header)
                if (!table.node.firstChild) return true;
                const isHeader = table.node.firstChild === row.node;
                if (isHeader) return true;
                
                // Get cell index to check if it's a due date column (3rd column)
                let cellIndex = 0;
                let isDueDateCell = false;
                
                // Safely get the cell index
                try {
                  let currentPos = row.pos + 1; // Skip the row node start
                  let i = 0;
                  
                  row.node.forEach((cell, offset) => {
                    // If this position matches our cell's position, this is our index
                    if (pos === currentPos) {
                      cellIndex = i;
                    }
                    currentPos += cell.nodeSize;
                    i++;
                  });
                } catch (cellIndexError) {
                  console.warn('Error getting cell index:', cellIndexError);
                  return true; // Skip this cell if we can't get its index
                }
                
                // Check if this is the due date column (3rd column, index 2)
                if (cellIndex === 2) {
                  isDueDateCell = true;
                }
                
                if (!isDueDateCell) return true;
                
                // Extract date from text content
                const textContent = node.textContent ? node.textContent.trim() : '';
                
                // Try to parse the date
                const dateObj = parseDate(textContent);
                const formattedDate = dateObj ? formatDate(dateObj) : (textContent || 'Select date');
                
                // Create a decoration for the whole cell
                decorations.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    class: `due-date-cell`,
                    'data-date': formattedDate,
                    style: `cursor: pointer !important; user-select: none !important; -webkit-user-modify: read-only !important; user-modify: read-only !important;`
                  })
                );
                
                // Add a decoration to the paragraph to wrap text in a styled div
                const textPos = pos + 1; // +1 to get inside the cell
                if (node.firstChild && node.firstChild.type && node.firstChild.type.name === 'paragraph') {
                  const paraPos = textPos;
                  const paraSize = node.firstChild.nodeSize;
                  
                  // Replace the paragraph content with a styled wrapper
                  decorations.push(
                    Decoration.node(paraPos, paraPos + paraSize, {
                      class: 'due-date-paragraph',
                      style: `display: flex; align-items: center; justify-content: center; margin: 0; min-height: 24px;`
                    })
                  );
                  
                  // If there's text content, wrap it in a styled span
                  const firstChildText = node.firstChild.textContent ? node.firstChild.textContent.trim() : '';
                  if (firstChildText.length > 0 || firstChildText === '') {
                    // Make sure we can safely access content props
                    if (node.firstChild.content && typeof node.firstChild.content.size !== 'undefined') {
                      const textNodePos = paraPos + 1; // +1 to get inside the paragraph
                      const textNodeSize = node.firstChild.content.size;
                      
                      decorations.push(
                        Decoration.inline(textNodePos, textNodePos + textNodeSize, {
                          class: 'due-date-tag-wrapper',
                          style: `
                            display: inline-block; 
                            padding: 3px 10px; 
                            border-radius: 4px; 
                            background-color: #F5F5F5; 
                            color: #333; 
                            font-size: 13px; 
                            font-weight: 600;
                            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                            cursor: pointer;
                            pointer-events: auto !important;
                          `
                        })
                      );
                    }
                  }
                }
              } catch (error) {
                console.warn('Error decorating due date cell:', error);
                // Continue processing other nodes even if there's an error with this one
              }
            }
            
            return true;
          });
          
          return DecorationSet.create(state.doc, decorations);
        },
        
        handleClick(view, pos, event) {
          try {
            // Check if this is a due date cell by DOM class first (most reliable)
            const target = event.target;
            const cell = target.closest('td');
            if (!cell || !cell.classList.contains('due-date-cell')) {
              return false;
            }
            
            console.log("DueDatePicker click handler called (confirmed due-date cell)", { pos });
            
            // Find the clicked node
            const { state } = view;
            const clickedNode = state.doc.nodeAt(pos);
            
            // If not in a table cell, return
            if (!clickedNode) return false;
            
            // Clean up any existing calendar
            try {
              document.querySelectorAll('.direct-calendar-container, .direct-dropdown-container').forEach(el => {
                if (document.body.contains(el)) {
                  document.body.removeChild(el);
                }
              });
            } catch (e) {
              console.log("No existing calendar to clean up");
            }
            
            // Extract date from text content
            const dateText = clickedNode.textContent ? clickedNode.textContent.trim() : '';
            const currentDate = parseDate(dateText) || new Date();
            
            console.log("Current date:", formatDate(currentDate));
            
            // Get the cell position for calendar placement
            const cellRect = cell.getBoundingClientRect();
            
            // Add data attribute to the cell for scroll tracking
            cell.dataset.tableCellPos = pos;
            
            // Create a container with explicit styling - fixed position
            const container = document.createElement('div');
            container.className = 'direct-calendar-container';
            container.id = 'calendar-' + Date.now();
            container.style.cssText = `
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              border-radius: 6px;
              box-shadow: 0 0 0 1px #5555ff, 0 2px 8px rgba(15, 15, 15, 0.1), 0 4px 12px rgba(15, 15, 15, 0.2);
              background: white;
              padding: 12px;
              width: 280px;
              position: fixed !important;
              top: ${cellRect.bottom - 10}px;
              left: ${cellRect.left}px;
              z-index: 2147483647 !important;
              transform-origin: top left;
              opacity: 0;
              transform: scale(0.95);
              transition: opacity 0.2s ease, transform 0.2s ease;
            `;
            
            // Add directly to document body
            document.body.appendChild(container);
            console.log("Calendar added to document body", container);
            
            // Create a simple HTML calendar
            const calendarHTML = `
              <style>
                @keyframes dropdownFadeIn {
                  from {
                    opacity: 0;
                    transform: translateY(-8px) scale(0.98);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                  }
                }
                
                .calendar-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 12px;
                }
                
                .calendar-month-year {
                  font-size: 14px;
                  font-weight: 600;
                  color: rgb(55, 53, 47);
                  flex: 1;
                  text-align: center;
                }
                
                .calendar-nav-btn {
                  background: transparent;
                  border: none;
                  cursor: pointer;
                  color: rgb(55, 53, 47);
                  border-radius: 3px;
                  width: 28px;
                  height: 28px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                
                .calendar-nav-btn:hover {
                  background-color: rgba(55, 53, 47, 0.08);
                }
                
                .calendar-day:hover {
                  background-color: rgba(55, 53, 47, 0.08) !important;
                }
                
                .calendar-day.selected {
                  background-color: rgb(35, 131, 226) !important;
                  color: white !important;
                }
                
                .calendar-day.today:not(.selected) {
                  border: 1px solid rgb(35, 131, 226) !important;
                }
                
                .calendar-day.disabled {
                  opacity: 0.4 !important;
                  cursor: default !important;
                  pointer-events: none !important;
                  text-decoration: line-through !important;
                }
                
                .calendar-btn {
                  border: none !important;
                  background-color: transparent !important;
                  cursor: pointer !important;
                  border-radius: 3px !important;
                  font-size: 14px !important;
                  padding: 6px 8px !important;
                  color: rgb(55, 53, 47) !important;
                  transition: background 0.1s ease-in !important;
                }
                
                .calendar-btn:hover {
                  background-color: rgba(55, 53, 47, 0.08) !important;
                }
                
                .calendar-btn.primary {
                  background-color: rgb(35, 131, 226) !important;
                  color: white !important;
                }
                
                .calendar-btn.primary:hover {
                  background-color: rgba(35, 131, 226, 0.8) !important;
                }
              </style>

              <div class="calendar-header">
                <button id="prev-month-btn" class="calendar-nav-btn">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 4L6 8L10 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <div id="month-year-display" class="calendar-month-year">Month Year</div>
                <button id="next-month-btn" class="calendar-nav-btn">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>

              <div style="
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 2px;
                margin-bottom: 8px;
                font-size: 12px;
                color: rgba(55, 53, 47, 0.6);
                text-align: center;
                font-weight: 500;
              ">
                <div>Su</div>
                <div>Mo</div>
                <div>Tu</div>
                <div>We</div>
                <div>Th</div>
                <div>Fr</div>
                <div>Sa</div>
              </div>
              
              <div id="calendar-days-grid" style="
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 2px;
                margin-bottom: 8px;
              "></div>
              
              <div style="
                display: flex;
                justify-content: center;
                padding-top: 4px;
                border-top: 1px solid rgba(55, 53, 47, 0.1);
              ">
                <button id="today-date-btn" class="calendar-btn primary">Today</button>
              </div>
            `;
            
            container.innerHTML = calendarHTML;
            
            // Set initial opacity after a brief delay for animation
            setTimeout(() => {
              container.style.opacity = '1';
              container.style.transform = 'scale(1)';
            }, 10);

            // Store data for event handlers
            const calendarData = { view, pos, state };

            // Initialize month and year variables that can be updated
            let currentYear = currentDate.getFullYear();
            let currentMonth = currentDate.getMonth();
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            // Update month year display
            const monthYearDisplay = container.querySelector('#month-year-display');
            if (monthYearDisplay) {
              monthYearDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
            }

            // Function to rebuild the calendar for a specific month/year
            const buildCalendarDays = () => {
              const daysGrid = container.querySelector('#calendar-days-grid');
              if (!daysGrid) return;
              
              // Clear existing days
              daysGrid.innerHTML = '';
              
              // Get first day of month and number of days
              const firstDay = new Date(currentYear, currentMonth, 1);
              const lastDay = new Date(currentYear, currentMonth + 1, 0);
              const numDays = lastDay.getDate();
              const startOffset = firstDay.getDay(); // 0 = Sunday
              
              // Current date for comparison
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              // Add empty cells for days before the 1st
              for (let i = 0; i < startOffset; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.style.cssText = `
                  width: 100%;
                  height: 28px;
                `;
                daysGrid.appendChild(emptyCell);
              }
              
              // Add cells for each day of the month
              for (let day = 1; day <= numDays; day++) {
                const dayCell = document.createElement('div');
                const currentDate = new Date(currentYear, currentMonth, day);
                currentDate.setHours(0, 0, 0, 0);
                
                const isToday = today.getTime() === currentDate.getTime();
                const isPast = currentDate.getTime() < today.getTime();
                const isSelected = currentDate.getDate() === day && currentDate.getMonth() === currentMonth && currentDate.getFullYear() === currentYear;
                
                dayCell.textContent = day;
                dayCell.className = `calendar-day${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${isPast ? ' disabled' : ''}`;
                dayCell.style.cssText = `
                  width: 100%;
                  height: 28px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: ${isPast ? 'default' : 'pointer'};
                  border-radius: 3px;
                  font-size: 14px;
                  color: ${isSelected ? 'white' : 'rgb(55, 53, 47)'};
                  user-select: none;
                  ${isPast ? 'opacity: 0.4;' : ''}
                `;
                
                // Add click handler only if not past
                if (!isPast) {
                  dayCell.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    // Add visual feedback on click
                    if (!isSelected) {
                      dayCell.style.backgroundColor = 'rgba(35, 131, 226, 0.8)';
                      dayCell.style.color = 'white';
                    }
                    
                    // Create a new date with selected day
                    const selectedDate = new Date(currentYear, currentMonth, day);
                    const formattedDate = formatDate(selectedDate);
                    console.log("Day selected:", formattedDate);
                    
                    setTimeout(() => {
                      try {
                        // Get the resolved position
                        const $pos = state.doc.resolve(pos);
                        
                        // Find parent table cell node position
                        let depth = $pos.depth;
                        let cellPos = null;
                        
                        // Walk up the node hierarchy to find the table cell
                        while (depth > 0) {
                          const node = $pos.node(depth);
                          if (node.type.name === 'tableCell') {
                            cellPos = $pos.before(depth);
                            break;
                          }
                          depth--;
                        }
                        
                        if (!cellPos) {
                          console.error("Could not find table cell position");
                          return;
                        }
                        
                        // Get the DOM node for the cell for direct manipulation
                        let domCell = null;
                        try {
                          domCell = view.nodeDOM(cellPos);
                        } catch (e) {
                          console.log("Could not get DOM node for cell:", e);
                        }
                        
                        // Create a transaction
                        const tr = state.tr;
                        
                        // Get cell node
                        const cellNode = state.doc.nodeAt(cellPos);
                        if (!cellNode) {
                          console.error("Could not find cell node");
                          return;
                        }
                        
                        // Create a new text node with selected date
                        const textNode = state.schema.text(formattedDate);
                        
                        // Create a paragraph to hold the text
                        const paragraph = state.schema.nodes.paragraph.create(null, textNode);
                        
                        // Directly replace all the content of the cell with our new content
                        const newCell = state.schema.nodes.tableCell.create(
                          cellNode.attrs,
                          paragraph
                        );
                        
                        // Replace the entire cell to ensure clean replacement
                        tr.replaceWith(cellPos, cellPos + cellNode.nodeSize, newCell);
                        
                        // Dispatch the transaction
                view.dispatch(tr);
                
                        // DOM update is unreliable here, so rely on ProseMirror's rendering instead
                        console.log("Date updated via transaction");
                      } catch (error) {
                        console.error("Error updating date:", error);
                      }
                      
                      // Add fade out animation
                      container.style.opacity = '0';
                      container.style.transform = 'scale(0.95)';
                      container.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                      
                      setTimeout(() => {
                        // Remove calendar
                        if (document.body.contains(container)) {
                          document.body.removeChild(container);
                        }
                      }, 200);
                    }, 150);
                  });
                }
                
                daysGrid.appendChild(dayCell);
              }
            };

            // Build the initial calendar days
            buildCalendarDays();

            // Set up previous month button
            const prevMonthBtn = container.querySelector('#prev-month-btn');
            if (prevMonthBtn) {
              prevMonthBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Change month and handle year change if needed
                currentMonth--;
                if (currentMonth < 0) {
                  currentMonth = 11;
                  currentYear--;
                }
                
                // Update month/year display
                if (monthYearDisplay) {
                  monthYearDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
                }
                
                // Rebuild the calendar
                buildCalendarDays();
              });
            }

            // Set up next month button
            const nextMonthBtn = container.querySelector('#next-month-btn');
            if (nextMonthBtn) {
              nextMonthBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Change month and handle year change if needed
                currentMonth++;
                if (currentMonth > 11) {
                  currentMonth = 0;
                  currentYear++;
                }
                
                // Update month/year display
                if (monthYearDisplay) {
                  monthYearDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
                }
                
                // Rebuild the calendar
                buildCalendarDays();
              });
            }

            // Set up Today button
            const todayBtn = container.querySelector('#today-date-btn');
            if (todayBtn) {
              todayBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Add visual feedback
                todayBtn.style.backgroundColor = 'rgba(35, 131, 226, 0.8)';
                
                setTimeout(() => {
                  // Get today's date formatted
                  const today = new Date();
                  const formattedDate = formatDate(today);
                  console.log("Today button clicked:", formattedDate);
                  
                  try {
                    // Get the resolved position
                    const $pos = state.doc.resolve(pos);
                    
                    // Find parent table cell node position
                    let depth = $pos.depth;
                    let cellPos = null;
                    
                    // Walk up the node hierarchy to find the table cell
                    while (depth > 0) {
                      const node = $pos.node(depth);
                      if (node.type.name === 'tableCell') {
                        cellPos = $pos.before(depth);
                        break;
                      }
                      depth--;
                    }
                    
                    if (!cellPos) {
                      console.error("Could not find table cell position");
                      return;
                    }
                    
                    // Create a transaction
                    const tr = state.tr;
                    
                    // Get cell node
                    const cellNode = state.doc.nodeAt(cellPos);
                    if (!cellNode) {
                      console.error("Could not find cell node");
                      return;
                    }
                    
                    // Create a new text node with today's date
                    const textNode = state.schema.text(formattedDate);
                    
                    // Create a paragraph to hold the text
                    const paragraph = state.schema.nodes.paragraph.create(null, textNode);
                    
                    // Directly replace all the content of the cell with our new content
                    const newCell = state.schema.nodes.tableCell.create(
                      cellNode.attrs,
                      paragraph
                    );
                    
                    // Replace the entire cell to ensure clean replacement
                    tr.replaceWith(cellPos, cellPos + cellNode.nodeSize, newCell);
                    
                    // Dispatch the transaction
                    view.dispatch(tr);
                    
                    // DOM update is unreliable here, so rely on ProseMirror's rendering instead
                    console.log("Date updated via transaction");
                  } catch (error) {
                    console.error("Error updating date:", error);
                  }
                  
                  // Add fade out animation
                  container.style.opacity = '0';
                  container.style.transform = 'scale(0.95)';
                  container.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                  
                  setTimeout(() => {
                    // Remove calendar
                    if (document.body.contains(container)) {
                      document.body.removeChild(container);
                    }
                  }, 200);
                }, 150);
              });
            }

            // Function to handle outside clicks and close the calendar
            const handleOutsideClick = (e) => {
              // If the click is outside the calendar container
              if (!container.contains(e.target)) {
                // Remove the event listener first to prevent multiple calls
                document.removeEventListener('click', handleOutsideClick);
                
                // Add fade out animation
                container.style.opacity = '0';
                container.style.transform = 'scale(0.95)';
                container.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                
                setTimeout(() => {
                  // Only remove if it still exists
                  if (document.body.contains(container)) {
                    document.body.removeChild(container);
                  }
                }, 200);
              }
            };

            // Add listener with delay to avoid immediate triggering
            setTimeout(() => {
              document.addEventListener('click', handleOutsideClick);
            }, 100);
            
            // Stop event propagation
            event.stopPropagation();
            event.preventDefault();
            return true;
          } catch (error) {
            console.error('Error handling due date picker:', error);
            return false;
          }
        },
      },
    });

    return [plugin];
  },
});

// Define our slash commands with icons
const slashCommands = [
  {
    id: 'paragraph',
    label: 'Text',
    description: 'Just start writing with plain text',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-text"><path d="M17.5 10H6.5"/><path d="M6 14L8 14"/><path d="M12.5 14L16.5 14"/><path d="M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z"/></svg>',
    action: ({ editor }) => {
      editor
        .chain()
        .focus()
        .setParagraph()
        .run()
    },
  },
  {
    id: 'heading1',
    label: 'Heading 1',
    description: 'Large section heading',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heading-1"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="m17 12 3-2v8"/></svg>',
    action: ({ editor }) => {
      editor
        .chain()
        .focus()
        .setHeading({ level: 1 })
        .run()
    },
  },
  {
    id: 'heading2',
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heading-2"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"/></svg>',
    action: ({ editor }) => {
      editor
        .chain()
        .focus()
        .setHeading({ level: 2 })
        .run()
    },
  },
  {
    id: 'heading3',
    label: 'Heading 3',
    description: 'Small section heading',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heading-3"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2"/><path d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2"/></svg>',
    action: ({ editor }) => {
      editor
        .chain()
        .focus()
        .setHeading({ level: 3 })
        .run()
    },
  },
  {
    id: 'bulletList',
    label: 'Bullet List',
    description: 'Create a bullet list (use Tab to nest)',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>',
    action: ({ editor }) => {
      editor
        .chain()
        .focus()
        .toggleBulletList()
        .run()
    },
  },
  {
    id: 'orderedList',
    label: 'Numbered List',
    description: 'Create a numbered list (use Tab to nest)',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-ordered"><line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>',
    action: ({ editor }) => {
      editor
        .chain()
        .focus()
        .toggleOrderedList()
        .run()
    },
  },
  {
    id: 'codeBlock',
    label: 'Code Block',
    description: 'Add a code block',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
    action: ({ editor }) => {
      editor
        .chain()
        .focus()
        .setCodeBlock()
        .run()
    },
  },
  {
    id: 'blockquote',
    label: 'Quote',
    description: 'Add a quote block',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-quote"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>',
    action: ({ editor }) => {
      editor
        .chain()
        .focus()
        .toggleBlockquote()
        .run()
    },
  },
  {
    id: 'taskList',
    label: 'Task List',
    description: 'Add a task list',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-square"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    action: ({ editor }) => {
      editor
        .chain()
        .focus()
        .toggleTaskList()
        .run()
    },
  },
  {
    id: 'table',
    label: 'Table',
    description: 'Add a table',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-table"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>',
    action: ({ editor, range }) => {
      if (!editor) return;
      
      if (range) {
        editor.chain().focus().deleteRange(range).run();
      }
      
      // Insert a table using TipTap's API
      editor.chain().focus().insertTable({
        rows: 3,
        cols: 3,
        withHeaderRow: true
      }).run();
    },
  },
]

// Utility to format dates
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  
  return `${month} ${day}, ${year}`;
};

// Parse a date string in various formats
const parseDate = (dateString) => {
  if (!dateString) return null;
  
  // Try to parse the date string
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  return null;
};

// Create a direct DOM dropdown function to bypass React rendering
const createDirectDomDropdown = (type, options, position, currentValue, onSelect) => {
  console.log(`Creating ${type} dropdown at position:`, position);
  
  // Clean up ALL existing dropdowns first to prevent multiple handlers showing dropdowns
  try {
    document.querySelectorAll('.direct-dropdown-container, .direct-calendar-container').forEach(el => {
      if (document.body.contains(el)) {
        document.body.removeChild(el);
      }
    });
    document.querySelectorAll('div[id^="marker-"]').forEach(el => {
      if (document.body.contains(el)) {
        document.body.removeChild(el);
      }
    });
  } catch (e) {
    console.log("Error cleaning up existing dropdowns:", e);
  }

  // Assign different z-index based on dropdown type
  let zIndex = 2147483647; // Max z-index for all dropdowns
  let borderColor = '#dddddd'; // Default border color

  // Switch statement to set z-index and border color based on dropdown type
  switch(type) {
    case 'status':
      zIndex = 2147483647; // Highest
      borderColor = '#ff5555'; // Red
      break;
    case 'priority':
      zIndex = 2147483646; // Second highest
      borderColor = '#55ff55'; // Green
      break;
    case 'calendar':
      zIndex = 2147483645; // Third highest
      borderColor = '#5555ff'; // Blue
      break;
    default:
      // Use defaults
      break;
  }
  
  // Create a container div first with explicit styling
  const container = document.createElement('div');
  container.id = `${type}-dropdown-${Date.now()}`;
  container.className = `direct-dropdown-container ${type}-dropdown-fixed`;
  
  // Position directly below the cell's bottom edge with fixed position
  const topPosition = position.top + 1; 
  const leftPosition = position.left;
  
  // Direct style assignment with !important flags to override any other styles
  container.style.cssText = `
    position: fixed !important;
    z-index: ${zIndex} !important;
    top: ${topPosition}px !important;
    left: ${leftPosition}px !important;
    width: 180px !important;
    background-color: white !important;
    border-radius: 5px !important;
    box-shadow: 0 0 0 1px ${borderColor}, 0 5px 10px rgba(15, 15, 15, 0.1) !important;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    transform-origin: top center !important;
    animation: dropdownFadeIn 0.1s ease-out forwards !important;
    overflow: hidden !important;
  `;

  // Create a simple HTML string for the dropdown
  let htmlContent = `
    <style>
      @keyframes dropdownFadeIn {
        from {
          opacity: 0;
          transform: translateY(-8px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      .direct-dropdown-option {
        transition: background-color 0.1s ease;
      }
      
      .direct-dropdown-option:hover {
        background-color: rgba(55, 53, 47, 0.08) !important;
      }
      
      .direct-dropdown-option.selected {
        background-color: rgba(55, 53, 47, 0.1) !important;
      }
    </style>
    <div class="direct-dropdown-options" style="
      max-height: 250px !important;
      overflow-y: auto !important;
      padding: 4px !important;
    ">
  `;

  // Add options to the HTML string
  options.forEach(option => {
    const isSelected = option.value === currentValue;
    const value = option.value || option;
    let optionHtml = `
      <div class="direct-dropdown-option ${isSelected ? 'selected' : ''}" data-value="${value}" style="
        padding: 6px 8px !important;
        cursor: pointer !important;
        border-radius: 3px !important;
        margin: 2px 4px !important;
        display: flex !important;
        align-items: center !important;
        font-size: 14px !important;
        color: rgb(55, 53, 47) !important;
        transition: background 0.1s ease-in !important;
        user-select: none !important;
      ">
    `;
    
    // Add color tag if relevant
    if (option.backgroundColor) {
      optionHtml += `
        <span style="
          display: inline-block !important;
          width: 12px !important;
          height: 12px !important;
          border-radius: 3px !important;
          margin-right: 8px !important;
          background-color: ${option.backgroundColor} !important;
          flex-shrink: 0 !important;
        "></span>
      `;
    }
    
    // Add text
    optionHtml += `
        <span style="
          font-size: 14px !important;
          color: rgb(55, 53, 47) !important;
          font-weight: ${isSelected ? '500' : 'normal'} !important;
        ">${value}</span>
        
        ${isSelected ? `
          <span style="
            margin-left: auto !important;
            width: 16px !important;
            height: 16px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          ">
            <svg viewBox="0 0 14 14" style="width: 12px; height: 12px; display: block; fill: rgba(55, 53, 47, 0.7); flex-shrink: 0; backface-visibility: hidden;">
              <polygon points="5.5 11.9993304 14 3.49933039 12.5 2 5.5 8.99933039 1.5 4.9968652 0 6.49933039"></polygon>
            </svg>
          </span>
        ` : ''}
      </div>
    `;
    
    htmlContent += optionHtml;
  });
  
  // Close the options container
  htmlContent += `</div>`;

  // Set the HTML content
  container.innerHTML = htmlContent;

  // Add directly to document body
  document.body.appendChild(container);
  console.log(`${type} dropdown appended to document body:`, container);
  
  // Update container cleanup to remove all traces
  const cleanupDropdown = () => {
    // Remove the dropdown
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    
    // Remove any markers
    document.querySelectorAll('div[id^="marker-"]').forEach(el => {
      if (document.body.contains(el)) {
        document.body.removeChild(el);
      }
    });
  };
  
  // Add click handlers to options after the container is in the DOM
  const optionElements = container.querySelectorAll('.direct-dropdown-option');
  console.log(`Found ${optionElements.length} options in dropdown`);
  
  optionElements.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Add visual feedback on click
      option.style.backgroundColor = 'rgba(55, 53, 47, 0.16)';
      
      const value = option.getAttribute('data-value');
      console.log(`${type} option selected:`, value);
      
      // Call the onSelect callback with a slight delay for animation
      setTimeout(() => {
        onSelect(value);
        
        // Clean up
        container.style.opacity = '0';
        container.style.transform = 'translateY(-8px) scale(0.98)';
        container.style.transition = 'opacity 0.1s ease-out, transform 0.1s ease-out';
        
        // Clean up after animation
        setTimeout(() => {
          cleanupDropdown();
        }, 100);
      }, 150);
    });
  });
  
  // Add outside click handler to close dropdown
  const handleOutsideClick = (e) => {
    if (!container.contains(e.target)) {
      console.log(`Outside click detected, removing ${type} dropdown`);
      
      // Add fade out animation
      container.style.opacity = '0';
      container.style.transform = 'translateY(-8px) scale(0.98)';
      container.style.transition = 'opacity 0.1s ease-out, transform 0.1s ease-out';
      
      setTimeout(() => {
        cleanupDropdown();
        document.removeEventListener('click', handleOutsideClick);
      }, 100);
    }
  };
  
  // Add listener with delay to avoid immediate triggering
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick);
  }, 100);
  
  return container;
};

export default function Editor({
  content = '',
  onUpdate = () => {},
  pageId,
  customExtensions = [],
  onEditorReady = () => {} // Add this line to accept the callback
}) {
  const [showSlashCommands, setShowSlashCommands] = useState(false)
  const [slashCommandsPosition, setSlashCommandsPosition] = useState(null)
  const [slashCommandsRange, setSlashCommandsRange] = useState(null)
  const menuRef = useRef(null)
  const editorRef = useRef(null)
  const [showPopup, setShowPopup] = useState(false)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const [showTableControls, setShowTableControls] = useState(false)
  const [tableControlsPosition, setTableControlsPosition] = useState({ top: 0, left: 0 })
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false)

  const handleSlashCommand = (command, range) => {
    // Delete any text in the range where command was typed
      if (range) {
      editor.chain().focus().deleteRange(range).run();
    }
    
    if (command === '/table' || command === 'table') {
      // Insert a table using TipTap's API
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
      setShowSlashCommands(false);
      return;
    } else if (command === '/h1' || command === 'h1') {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    } else if (command === '/h2' || command === 'h2') {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    } else if (command === '/h3' || command === 'h3') {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    } else if (command === '/bullet' || command === 'bullet') {
      editor.chain().focus().toggleBulletList().run();
    } else if (command === '/number' || command === 'number') {
      editor.chain().focus().toggleOrderedList().run();
    } else if (command === '/check' || command === 'check' || command === '/checkbox' || command === 'checkbox') {
      editor.chain().focus().toggleTaskList().run();
    } else if (command === '/quote' || command === 'quote') {
      editor.chain().focus().toggleBlockquote().run();
    } else if (command === '/code' || command === 'code') {
      editor.chain().focus().toggleCodeBlock().run();
    } else if (command === '/divider' || command === 'divider') {
      editor.chain().focus().setHorizontalRule().run();
    } else if (typeof command === 'object' && command.action) {
      // Handle command objects with action property
      command.action({ editor, range });
    }
    
    setShowSlashCommands(false);
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
        strike: false,
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
      }),
      TableRow,
      CustomTableCell,
      TableHeader,
      Underline,
      Strike,
      // Change the order to prioritize cell-specific handlers
      StatusDropdown,
      DueDatePicker,
      PriorityDropdown,
      // Add the custom extensions here
      ...customExtensions,
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
          
          // Get the current cursor position
          const { selection } = view.state
          const { $from } = selection
          
          // Get DOM coordinates at cursor position
          const coords = view.coordsAtPos($from.pos)
          
          // Get editor element for relative positioning
          const editorElement = view.dom.getBoundingClientRect()
          
          // Calculate position relative to editor
          setSlashCommandsPosition({
            left: coords.left - editorElement.left,
            top: coords.bottom - editorElement.top + 10,
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
      handleClick: (view, pos, event) => {
        const { state } = view
        const $pos = state.doc.resolve(pos)
        let depth = $pos.depth
        let isInTable = false
        let tableNode = null
        let tablePos = 0

        // Traverse up the node tree to find if we're inside a table
        while (depth > 0 && !isInTable) {
          const node = $pos.node(depth)
          if (node.type.name === 'table') {
            isInTable = true
            tableNode = node
            tablePos = $pos.before(depth)
            break
          }
          depth--
        }

        if (isInTable && tableNode) {
          // Get coordinates for the table start position
          const tableCoords = view.coordsAtPos(tablePos)
          const editorRect = view.dom.getBoundingClientRect()
          
          // Get the table element to calculate its width
          const tableElement = view.nodeDOM(tablePos)
          const tableWidth = tableElement ? tableElement.offsetWidth : 0
          
          // Calculate center position and adjust top position
          setTableControlsPosition({
            left: tableCoords.left - editorRect.left + (tableWidth / 2) - 45, // Center the controls (90px width / 2 = 45)
            top: tableCoords.top - editorRect.top // Position directly at table's top edge
          })
          setShowTableControls(true)
          setIsTableDropdownOpen(false) // Close dropdown when clicking elsewhere in table
        } else {
          setShowTableControls(false)
          setIsTableDropdownOpen(false)
        }
      },
      handleDOMEvents: {
        click: (view, event) => {
          try {
            // Find out if we clicked on a table cell
            const target = event.target;
            const cell = target.closest('td');
            
            if (!cell) return false; // Not clicking in a table
            
            // Log which classes the cell has for debugging
            console.log("Cell classes:", cell.className);
            
            // Check cell classnames to determine type - implement exclusive handling
            if (cell.classList.contains('status-cell')) {
              console.log("Detected click on STATUS cell, letting StatusDropdown handle it");
              // The StatusDropdown handler will take care of this
              return false;
            } else if (cell.classList.contains('due-date-cell')) {
              console.log("Detected click on DUE DATE cell, letting DueDatePicker handle it");
              // The DueDatePicker handler will take care of this
              return false;
            } else if (cell.classList.contains('priority-cell')) {
              console.log("Detected click on PRIORITY cell, letting PriorityDropdown handle it");
              // The PriorityDropdown handler will take care of this
              return false;
            }
            
            // For regular table cells, let the default handler process them
            console.log("Regular table cell click - standard handling");
            return false;
          } catch (error) {
            console.error('Error handling table cell click:', error);
            return false;
          }
        },
        // ... other handlers ...
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

  // Add DOM click handlers for priority and status tags
  useEffect(() => {
    const handleTagClicks = (event) => {
      // Handle priority tag clicks
      if (event.target.classList.contains('priority-tag-wrapper') || 
          event.target.closest('.priority-tag-wrapper')) {
        const tagElement = event.target.classList.contains('priority-tag-wrapper') ? 
                           event.target : event.target.closest('.priority-tag-wrapper');
        
        // Get the cell element
        const cellElement = tagElement.closest('td');
        if (!cellElement) return;
        
        console.log('Priority tag clicked');
        
        // Get current priority
        const currentPriority = cellElement.getAttribute('data-priority') || 
                               tagElement.textContent.trim() || 
                               "Not Set";
        
        // Create dropdown
        const editorElement = document.querySelector('.editor-content');
        if (!editorElement) return;
        
        // Create dropdown container
        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'priority-dropdown-fixed';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'priority-dropdown-header';
        header.textContent = 'PRIORITY';
        dropdownContainer.appendChild(header);
        
        // Create options container
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'priority-dropdown-options';
        
        // Add options to the dropdown
        priorityOptions.forEach(option => {
          const item = document.createElement('div');
          item.className = `priority-option ${option.value === currentPriority ? 'selected' : ''}`;
          
          // Create tag-like appearance for the option
          const tag = document.createElement('div');
          tag.className = 'priority-tag';
          tag.textContent = option.value;
          tag.style.backgroundColor = option.backgroundColor;
          tag.style.color = "black";
          tag.setAttribute('data-value', option.value);
          
          item.appendChild(tag);
          
          // Add click handler to each option
          item.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log("Option clicked:", option.value);
            
            // Update cell attributes and styling
            cell.setAttribute('data-priority', option.value);
            cell.setAttribute('data-priority-color', option.color || "black");
            cell.setAttribute('data-priority-bg', option.backgroundColor);
            cell.style.backgroundColor = 'transparent';
            
            // Update tag if it exists or create a new one
            if (tagElement) {
              tagElement.textContent = option.value;
              tagElement.style.backgroundColor = option.backgroundColor;
              tagElement.style.color = "black";
              tagElement.setAttribute('data-value', option.value);
            } else {
              // Create a new paragraph with tag
              const newP = document.createElement('p');
              newP.className = 'priority-paragraph';
              newP.style.display = 'flex';
              newP.style.alignItems = 'center';
              newP.style.justifyContent = 'center';
              
              const newTag = document.createElement('span');
              newTag.className = 'priority-tag-wrapper';
              newTag.textContent = option.value;
              newTag.style.backgroundColor = option.backgroundColor;
              newTag.style.color = "black";
              newTag.style.padding = '4px 10px';
              newTag.style.borderRadius = '3px';
              newTag.style.fontWeight = '500';
              newTag.style.display = 'inline-block';
              newTag.setAttribute('data-value', option.value);
              
              newP.appendChild(newTag);
              
              // Replace cell content
              cell.innerHTML = '';
              cell.appendChild(newP);
            }
            
            // Also update the document model
            try {
              const { state } = view;
              const { tr } = state;
              const posInfo = view.posAtDOM(cell, 0);
              
              if (posInfo) {
                // Find the actual cell node
                let cellPos = null;
                state.doc.nodesBetween(posInfo, posInfo + 100, (node, pos) => {
                  if (node.type.name === 'tableCell' && !cellPos) {
                    cellPos = pos;
                    return false;
                  }
                  return true;
                });
                
                if (cellPos !== null) {
                  // Create a paragraph with the selected priority text
                  const schema = state.schema;
                  const paragraph = schema.nodes.paragraph.create(
                    null,
                    schema.text(option.value)
                  );
                  
                  // Replace the cell content
                  tr.replaceWith(
                    cellPos + 1, 
                    cellPos + state.doc.nodeAt(cellPos).content.size + 1,
                    paragraph
                  );
                  
                  view.dispatch(tr);
                }
              }
            } catch (err) {
              console.error("Error updating document model:", err);
            }
            
            // Add a brief animation to the selected cell
            cell.style.transition = 'all 0.2s ease-out';
            cell.style.transform = 'scale(1.05)';
            setTimeout(() => {
              cell.style.transform = 'scale(1)';
            }, 150);
            
            // Remove the dropdown with a fade-out effect
            dropdownContainer.style.opacity = '0';
            dropdownContainer.style.transform = 'translateY(-3px)';
            dropdownContainer.style.transition = 'all 0.15s ease-out';
            
            setTimeout(() => {
              if (dropdownContainer.parentNode) {
                dropdownContainer.parentNode.removeChild(dropdownContainer);
                document.removeEventListener('click', handleOutsideClick);
              }
            }, 150);
          });
          
          optionsContainer.appendChild(item);
        });
        
        dropdownContainer.appendChild(optionsContainer);
        
        // Position the dropdown relative to the tag or cell
        const elementRect = actualTagElement.getBoundingClientRect();
        const editorRect = document.querySelector('.editor-content').getBoundingClientRect();
        
        dropdownContainer.style.position = 'absolute';
        dropdownContainer.style.left = `${elementRect.left - editorRect.left}px`;
        dropdownContainer.style.top = `${elementRect.bottom - editorRect.top + 5}px`;
        
        // Add the dropdown to the editor
        document.querySelector('.editor-content').appendChild(dropdownContainer);
        
        // Handle clicks outside the dropdown
        const handleOutsideClick = (e) => {
          if (!dropdownContainer.contains(e.target) && e.target !== actualTagElement) {
            if (dropdownContainer.parentNode) {
              dropdownContainer.parentNode.removeChild(dropdownContainer);
              document.removeEventListener('click', handleOutsideClick);
            }
          }
        };
        
        // Add the click listener with a small delay to avoid the current click
        setTimeout(() => {
          document.addEventListener('click', handleOutsideClick);
        }, 10);
        
        // Stop event propagation
        event.preventDefault();
        event.stopPropagation();
        return true;
    }
    return false;
  }})

  // Add effect to call onEditorReady when editor is initialized
  useEffect(() => {
    if (editor) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

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
          className="slash-command-list"
          style={{
            position: 'absolute',
            left: `${slashCommandsPosition.left}px`,
            top: `${slashCommandsPosition.top}px`,
            zIndex: 9999,
            maxHeight: '300px',
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            backgroundColor: 'white',
            width: '280px',
            transform: 'translateX(-20px)'
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
      
      {/* Floating Table Controls */}
      {showTableControls && editor && (
        <div 
          className="table-controls-menu"
          style={{
            position: 'absolute',
            left: `${tableControlsPosition.left}px`,
            top: `${tableControlsPosition.top}px`,
            zIndex: 50,
          }}
        >
          <div className="table-dropdown">
            <button
              className="table-dropdown-trigger"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsTableDropdownOpen(!isTableDropdownOpen)
              }}
            >
              Options
            </button>
            {isTableDropdownOpen && (
              <div className="table-dropdown-content">
                <div className="table-dropdown-section">Add & Remove</div>
                <button
                  className="table-action-button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    editor.chain().focus().addRowAfter().run()
                    setIsTableDropdownOpen(false)
                  }}
                  title="Add Row"
                >
                  Add Row
                </button>
                <button
                  className="table-action-button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    editor.chain().focus().addColumnAfter().run()
                    setIsTableDropdownOpen(false)
                  }}
                  title="Add Column"
                >
                  Add Column
                </button>
                <button
                  className="table-action-button remove-button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    editor.chain().focus().deleteRow().run()
                    setIsTableDropdownOpen(false)
                  }}
                  title="Remove Row"
                >
                  Remove Row
                </button>
                <button
                  className="table-action-button remove-button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    editor.chain().focus().deleteColumn().run()
                    setIsTableDropdownOpen(false)
                  }}
                  title="Remove Column"
                >
                  Remove Column
                </button>
                <div className="table-dropdown-section">Layout</div>
                <button
                  className="table-action-button header-button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    
                    // Find the table node
                    const { state } = editor.view
                    const { doc, tr, schema } = state
                    
                    doc.descendants((node, pos) => {
                      if (node.type.name === 'table') {
                        // Check if first column (excluding first row) is currently header
                        const secondRowFirstCell = node.child(1)?.firstChild // Get first cell of second row
                        const makeHeader = secondRowFirstCell && secondRowFirstCell.type.name !== 'tableHeader'
                        
                        // Get number of rows
                        const numRows = node.childCount
                        let currentPos = pos + 1 // Skip the table node itself
                        
                        // Skip first row since it should remain as header
                        currentPos += node.firstChild.nodeSize
                        
                        // For each row after the first row
                        for (let row = 1; row < numRows; row++) {
                          const rowNode = node.child(row)
                          if (rowNode.firstChild) {
                            const firstCellPos = currentPos + 1 // Skip the row node
                            const firstCell = rowNode.firstChild
                            
                            // Create a new node of the desired type with the same content
                            const newNode = makeHeader 
                              ? schema.nodes.tableHeader.create(firstCell.attrs, firstCell.content)
                              : schema.nodes.tableCell.create(firstCell.attrs, firstCell.content)
                            
                            // Replace the node
                            tr.replaceWith(firstCellPos, firstCellPos + firstCell.nodeSize, newNode)
                          }
                          currentPos += rowNode.nodeSize
                        }
                        
                        editor.view.dispatch(tr)
                        return false // Stop after finding the table
                      }
                    })
                    
                    setIsTableDropdownOpen(false)
                  }}
                >
                  Column Header
                </button>
                <button
                  className="table-action-button delete-button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    editor.chain().focus().deleteTable().run()
                    setShowTableControls(false)
                    setIsTableDropdownOpen(false)
                  }}
                  title="Delete Table"
                >
                  Delete Table
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
