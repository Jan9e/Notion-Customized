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
            console.log("PriorityDropdown click handler called", { pos });
            
            // Find the clicked node
            const { state } = view;
            const clickedNode = state.doc.nodeAt(pos);
            
            // If not in a table cell, return
            if (!clickedNode) return false;
            
            // Check if this is a priority cell
            const parent = findParentNode(node => node.type.name === 'tableCell')(state.selection);
            if (!parent || !parent.node) return false;
            
            // Get the cell's column index (assuming priority is column 4)
            const table = findParentNode(node => node.type.name === 'table')(state.selection);
            if (!table || !table.node) return false;
            
            const row = findParentNode(node => node.type.name === 'tableRow')(state.selection);
            if (!row || !row.node) return false;
            
            // Count the position of this cell in the row
            let cellIndex = 0;
            let isPriorityCell = false;
            
            row.node.forEach((cell, _, i) => {
              if (parent.pos === row.pos + 1 + i) {
                cellIndex = i;
              }
            });
            
            // Check if this is the priority column (4th column, index 3)
            if (cellIndex === 3) {
              isPriorityCell = true;
            }
            
            if (!isPriorityCell) {
              console.log("Not a priority cell - column index:", cellIndex);
              return false;
            }
            
            console.log("Priority cell confirmed");
            
            // Find the actual clicked tag element
            let targetElement = event.target;
            let clickedOnTag = false;
            let actualTagElement = null;
            
            // Check if the clicked element is the tag or contains the tag wrapper
            while (targetElement && targetElement.tagName !== 'TD') {
              if (targetElement.classList && 
                 (targetElement.classList.contains('priority-tag-wrapper') || 
                  targetElement.classList.contains('goals-tracker-priority'))) {
                clickedOnTag = true;
                actualTagElement = targetElement;
                break;
              }
              targetElement = targetElement.parentElement;
            }
            
            console.log("Clicked on tag:", clickedOnTag);
            
            // Make sure we have a TD to work with
            const tdElement = event.target.closest('td');
            if (!tdElement) {
              console.log("No TD element found");
              return false;
            }
            
            // Find the tag element within the cell if we didn't click directly on it
            if (!actualTagElement) {
              actualTagElement = tdElement.querySelector('.priority-tag-wrapper');
              if (!actualTagElement) {
                // If no tag wrapper exists, use the cell itself
                actualTagElement = tdElement;
              }
            }
            
            // Get the current priority from cell attribute or content
            let currentPriority = tdElement.getAttribute('data-priority') || parent.node.textContent.trim() || 'Not Set';
            console.log("Current priority:", currentPriority);
            
            // Create dropdown container with fixed positioning
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
                tdElement.setAttribute('data-priority', option.value);
                tdElement.setAttribute('data-priority-color', option.color || "black");
                tdElement.setAttribute('data-priority-bg', option.backgroundColor);
                tdElement.style.backgroundColor = 'transparent';
                
                // Update tag if it exists or create a new one
                if (actualTagElement) {
                  actualTagElement.textContent = option.value;
                  actualTagElement.style.backgroundColor = option.backgroundColor;
                  actualTagElement.style.color = "black";
                  actualTagElement.setAttribute('data-value', option.value);
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
                  tdElement.innerHTML = '';
                  tdElement.appendChild(newP);
                }
                
                // Also update the document model
                try {
                  const { state } = view;
                  const { tr } = state;
                  const posInfo = view.posAtDOM(tdElement, 0);
                  
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
                tdElement.style.transition = 'all 0.2s ease-out';
                tdElement.style.transform = 'scale(1.05)';
                setTimeout(() => {
                  tdElement.style.transform = 'scale(1)';
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
          } catch (error) {
            console.error('Error handling priority cell click:', error);
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
                              color: ${statusOption.color}; 
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
            console.log("StatusDropdown click handler called", { pos });
            
            // Find the clicked node
            const { state } = view;
            const clickedNode = state.doc.nodeAt(pos);
            
            // If not in a table cell, return
            if (!clickedNode) return false;
            
            // Check if this is a status cell
            const parent = findParentNode(node => node.type.name === 'tableCell')(state.selection);
            if (!parent || !parent.node) return false;
            
            // Get the cell's column index (assuming status is column 2)
            const table = findParentNode(node => node.type.name === 'table')(state.selection);
            if (!table || !table.node) return false;
            
            const row = findParentNode(node => node.type.name === 'tableRow')(state.selection);
            if (!row || !row.node) return false;
            
            // Count the position of this cell in the row
            let cellIndex = 0;
            let isStatusCell = false;
            
            row.node.forEach((cell, _, i) => {
              if (parent.pos === row.pos + 1 + i) {
                cellIndex = i;
              }
            });
            
            // Check if this is the status column (2nd column, index 1)
            if (cellIndex === 1) {
              isStatusCell = true;
            }
            
            if (!isStatusCell) {
              console.log("Not a status cell - column index:", cellIndex);
              return false;
            }
            
            console.log("Status cell confirmed");
            
            // Find the actual clicked tag element
            let targetElement = event.target;
            let clickedOnTag = false;
            let actualTagElement = null;
            
            // Check if the clicked element is the tag or contains the tag wrapper
            while (targetElement && targetElement.tagName !== 'TD') {
              if (targetElement.classList && 
                 (targetElement.classList.contains('status-tag-wrapper') || 
                  targetElement.classList.contains('goals-tracker-status'))) {
                clickedOnTag = true;
                actualTagElement = targetElement;
                break;
              }
              targetElement = targetElement.parentElement;
            }
            
            console.log("Clicked on tag:", clickedOnTag);
            
            // Make sure we have a TD to work with
            const tdElement = event.target.closest('td');
            if (!tdElement) {
              console.log("No TD element found");
              return false;
            }
            
            // Find the tag element within the cell if we didn't click directly on it
            if (!actualTagElement) {
              actualTagElement = tdElement.querySelector('.status-tag-wrapper');
              if (!actualTagElement) {
                // If no tag wrapper exists, use the cell itself
                actualTagElement = tdElement;
              }
            }
            
            // Get the current status from cell attribute or content
            let currentStatus = tdElement.getAttribute('data-status') || parent.node.textContent.trim() || 'Todo';
            console.log("Current status:", currentStatus);
            
            // Create dropdown container with fixed positioning
            const dropdownContainer = document.createElement('div');
            dropdownContainer.className = 'status-dropdown-fixed';
            
            // Create header
            const header = document.createElement('div');
            header.className = 'status-dropdown-header';
            header.textContent = 'STATUS';
            dropdownContainer.appendChild(header);
            
            // Create options container
            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'status-dropdown-options';
            
            // Add options to the dropdown
            statusOptions.forEach(option => {
              const item = document.createElement('div');
              item.className = `status-option ${option.value === currentStatus ? 'selected' : ''}`;
              
              // Create tag-like appearance for the option
              const tag = document.createElement('div');
              tag.className = 'status-tag';
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
                tdElement.setAttribute('data-status', option.value);
                tdElement.setAttribute('data-status-color', option.color || "black");
                tdElement.setAttribute('data-status-bg', option.backgroundColor);
                tdElement.style.backgroundColor = 'transparent';
                
                // Update tag if it exists or create a new one
                if (actualTagElement) {
                  actualTagElement.textContent = option.value;
                  actualTagElement.style.backgroundColor = option.backgroundColor;
                  actualTagElement.style.color = "black";
                  actualTagElement.setAttribute('data-value', option.value);
                } else {
                  // Create a new paragraph with tag
                  const newP = document.createElement('p');
                  newP.className = 'status-paragraph';
                  newP.style.display = 'flex';
                  newP.style.alignItems = 'center';
                  newP.style.justifyContent = 'center';
                  
                  const newTag = document.createElement('span');
                  newTag.className = 'status-tag-wrapper';
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
                  tdElement.innerHTML = '';
                  tdElement.appendChild(newP);
                }
                
                // Also update the document model
                try {
                  const { state } = view;
                  const { tr } = state;
                  const posInfo = view.posAtDOM(tdElement, 0);
                  
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
                      // Create a paragraph with the selected status text
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
                tdElement.style.transition = 'all 0.2s ease-out';
                tdElement.style.transform = 'scale(1.05)';
                setTimeout(() => {
                  tdElement.style.transform = 'scale(1)';
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
          } catch (error) {
            console.error('Error handling status cell click:', error);
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
            console.log("DueDatePicker click handler called", { pos });
            
            // Find the clicked node
            const { state } = view;
            const clickedNode = state.doc.nodeAt(pos);
            
            // If not in a table cell, return
            if (!clickedNode) return false;
            
            // Check if this is a due date cell
            const parent = findParentNode(node => node.type.name === 'tableCell')(state.selection);
            if (!parent || !parent.node) return false;
            
            // Get the cell's column index 
            const table = findParentNode(node => node.type.name === 'table')(state.selection);
            if (!table || !table.node) return false;
            
            const row = findParentNode(node => node.type.name === 'tableRow')(state.selection);
            if (!row || !row.node) return false;
            
            // Count the position of this cell in the row
            let cellIndex = 0;
            let isDueDateCell = false;
            
            row.node.forEach((cell, _, i) => {
              if (parent.pos === row.pos + 1 + i) {
                cellIndex = i;
              }
            });
            
            // Check if this is the due date column (3rd column, index 2)
            if (cellIndex === 2) {
              isDueDateCell = true;
            }
            
            if (!isDueDateCell) {
              console.log("Not a due date cell - column index:", cellIndex);
              return false;
            }
            
            console.log("Due date cell confirmed");
            
            // Find the actual clicked tag element
            let targetElement = event.target;
            let clickedOnTag = false;
            let actualTagElement = null;
            
            // Check if the clicked element is the tag or contains the tag wrapper
            while (targetElement && targetElement.tagName !== 'TD') {
              if (targetElement.classList && 
                 (targetElement.classList.contains('due-date-tag-wrapper') || 
                  targetElement.classList.contains('goals-tracker-due-date'))) {
                clickedOnTag = true;
                actualTagElement = targetElement;
                break;
              }
              targetElement = targetElement.parentElement;
            }
            
            console.log("Clicked on tag:", clickedOnTag);
            
            // Make sure we have a TD to work with
            const tdElement = event.target.closest('td');
            if (!tdElement) {
              console.log("No TD element found");
              return false;
            }
            
            // Find the tag element within the cell if we didn't click directly on it
            if (!actualTagElement) {
              actualTagElement = tdElement.querySelector('.due-date-tag-wrapper');
              if (!actualTagElement) {
                // If no tag wrapper exists, use the cell itself
                actualTagElement = tdElement;
              }
            }
            
            // Get the current date from cell attribute or content
            let currentDate = tdElement.getAttribute('data-date') || parent.node.textContent.trim() || '';
            const dateObj = parseDate(currentDate);
            console.log("Current date:", currentDate, dateObj);
            
            // Create a simple datepicker
            const createCalendar = (year, month, selectedDate) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
              
              const firstDay = new Date(year, month, 1);
              const lastDay = new Date(year, month + 1, 0);
              const daysInMonth = lastDay.getDate();
              const startDayOfWeek = firstDay.getDay();
              
              // Month navigation
              const prevMonth = month === 0 ? 
                { month: 11, year: year - 1 } : 
                { month: month - 1, year };
              
              const nextMonth = month === 11 ? 
                { month: 0, year: year + 1 } : 
                { month: month + 1, year };
              
              // Create the month selector
              const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                  'July', 'August', 'September', 'October', 'November', 'December'];
              
              const monthContainer = document.createElement('div');
              monthContainer.className = 'calendar-header';
              
              // Previous month button - only enable if the month is current or future
              const prevButton = document.createElement('button');
              prevButton.innerHTML = '&lt;';
              prevButton.className = 'calendar-nav-button';
              
              // Disable previous month button if it would navigate to a past month
              const isPrevMonthInPast = (prevMonth.year < today.getFullYear()) || 
                                        (prevMonth.year === today.getFullYear() && prevMonth.month < today.getMonth());
              if (isPrevMonthInPast) {
                prevButton.disabled = true;
                prevButton.classList.add('disabled');
              }
              
              prevButton.addEventListener('click', (e) => {
                if (prevButton.disabled) return;
                e.stopPropagation();
                calendarContainer.innerHTML = '';
                calendarContainer.appendChild(
                  createCalendar(prevMonth.year, prevMonth.month, selectedDate)
                );
              });
              
              // Month and year display
              const monthDisplay = document.createElement('div');
              monthDisplay.className = 'calendar-month-year';
              monthDisplay.textContent = `${monthNames[month]} ${year}`;
              
              // Next month button
              const nextButton = document.createElement('button');
              nextButton.innerHTML = '&gt;';
              nextButton.className = 'calendar-nav-button';
              nextButton.addEventListener('click', (e) => {
                e.stopPropagation();
                calendarContainer.innerHTML = '';
                calendarContainer.appendChild(
                  createCalendar(nextMonth.year, nextMonth.month, selectedDate)
                );
              });
              
              monthContainer.appendChild(prevButton);
              monthContainer.appendChild(monthDisplay);
              monthContainer.appendChild(nextButton);
              
              // Create weekday headers
              const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
              const weekdayRow = document.createElement('div');
              weekdayRow.className = 'calendar-weekdays';
              
              weekDays.forEach(day => {
                const dayCell = document.createElement('div');
                dayCell.className = 'weekday-cell';
                dayCell.textContent = day;
                weekdayRow.appendChild(dayCell);
              });
              
              // Create grid of days
              const daysGrid = document.createElement('div');
              daysGrid.className = 'calendar-days';
              
              // Add empty cells for days before the first of the month
              for (let i = 0; i < startDayOfWeek; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.className = 'calendar-day empty';
                daysGrid.appendChild(emptyCell);
              }
              
              // Add days of the month
              for (let i = 1; i <= daysInMonth; i++) {
                const dayCell = document.createElement('div');
                dayCell.className = 'calendar-day';
                dayCell.textContent = i;
                
                // Check if this day is in the past
                const cellDate = new Date(year, month, i);
                cellDate.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
                const isPastDay = cellDate < today;
                
                if (isPastDay) {
                  dayCell.classList.add('past-day');
                  dayCell.classList.add('disabled');
                }
                
                // Check if this day is today
                const isToday = cellDate.getTime() === today.getTime();
                if (isToday) {
                  dayCell.classList.add('today');
                }
                
                // Check if this day is selected
                if (selectedDate && 
                    selectedDate.getDate() === i && 
                    selectedDate.getMonth() === month && 
                    selectedDate.getFullYear() === year) {
                  dayCell.classList.add('selected');
                }
                
                // Add click handler to select this date
                dayCell.addEventListener('click', (e) => {
                  // Skip if this is a past date
                  if (isPastDay) return;
                  
                  e.stopPropagation();
                  
                  const newDate = new Date(year, month, i);
                  const formattedDate = formatDate(newDate);
                  
                  // Update cell attributes and tag content
                  tdElement.setAttribute('data-date', formattedDate);
                  
                  if (actualTagElement) {
                    actualTagElement.textContent = formattedDate;
                  }
                  
                  // Also update the document model
                  try {
                    const { state } = view;
                    const { tr } = state;
                    const posInfo = view.posAtDOM(tdElement, 0);
                    
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
                        // Create a paragraph with the date text
                        const schema = state.schema;
                        const paragraph = schema.nodes.paragraph.create(
                          null,
                          schema.text(formattedDate)
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
                  
                  // Close the calendar with animation
                  dropdownContainer.style.opacity = '0';
                  dropdownContainer.style.transform = 'translateY(-3px)';
                  
                  setTimeout(() => {
                    if (dropdownContainer.parentNode) {
                      dropdownContainer.parentNode.removeChild(dropdownContainer);
                      document.removeEventListener('click', handleDateOutsideClick);
                    }
                  }, 150);
                });
                
                daysGrid.appendChild(dayCell);
              }
              
              // Create the calendar container
              const container = document.createElement('div');
              container.className = 'calendar-container';
              container.appendChild(monthContainer);
              container.appendChild(weekdayRow);
              container.appendChild(daysGrid);
              
              // Add buttons for quick actions
              const actionBar = document.createElement('div');
              actionBar.className = 'calendar-action-bar';
              
              // Today button
              const todayButton = document.createElement('button');
              todayButton.className = 'calendar-action-button';
              todayButton.textContent = 'Today';
              todayButton.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Set to today's date
                const today = new Date();
                const formattedToday = formatDate(today);
                
                // Update cell attributes and tag content
                tdElement.setAttribute('data-date', formattedToday);
                
                if (actualTagElement) {
                  actualTagElement.textContent = formattedToday;
                }
                
                // Also update the document model
                try {
                  const { state } = view;
                  const { tr } = state;
                  const posInfo = view.posAtDOM(tdElement, 0);
                  
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
                      // Create a paragraph with the date text
                      const schema = state.schema;
                      const paragraph = schema.nodes.paragraph.create(
                        null,
                        schema.text(formattedToday)
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
                
                // Close the calendar with animation
                dropdownContainer.style.opacity = '0';
                dropdownContainer.style.transform = 'translateY(-3px)';
                
                setTimeout(() => {
                  if (dropdownContainer.parentNode) {
                    dropdownContainer.parentNode.removeChild(dropdownContainer);
                    document.removeEventListener('click', handleDateOutsideClick);
                  }
                }, 150);
              });
              
              // Clear button
              const clearButton = document.createElement('button');
              clearButton.className = 'calendar-action-button clear';
              clearButton.textContent = 'Clear';
              clearButton.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Clear date
                tdElement.setAttribute('data-date', '');
                
                if (actualTagElement) {
                  actualTagElement.textContent = 'Select date';
                }
                
                // Also update the document model
                try {
                  const { state } = view;
                  const { tr } = state;
                  const posInfo = view.posAtDOM(tdElement, 0);
                  
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
                      // Create an empty paragraph
                      const schema = state.schema;
                      const paragraph = schema.nodes.paragraph.create(
                        null,
                        schema.text('')
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
                
                // Close the calendar with animation
                dropdownContainer.style.opacity = '0';
                dropdownContainer.style.transform = 'translateY(-3px)';
                
                setTimeout(() => {
                  if (dropdownContainer.parentNode) {
                    dropdownContainer.parentNode.removeChild(dropdownContainer);
                    document.removeEventListener('click', handleDateOutsideClick);
                  }
                }, 150);
              });
              
              actionBar.appendChild(todayButton);
              actionBar.appendChild(clearButton);
              container.appendChild(actionBar);
              
              return container;
            };
            
            // Create dropdown container
            const dropdownContainer = document.createElement('div');
            dropdownContainer.className = 'calendar-dropdown-fixed';
            
            // Determine initial date to show in calendar
            let initialDate = new Date();
            if (dateObj) {
              initialDate = dateObj;
            }
            
            // Create calendar and add to dropdown
            const month = initialDate.getMonth();
            const year = initialDate.getFullYear();
            const calendarContainer = document.createElement('div');
            calendarContainer.appendChild(createCalendar(year, month, dateObj));
            dropdownContainer.appendChild(calendarContainer);
            
            // Position dropdown
            const rect = actualTagElement.getBoundingClientRect();
            const editorRect = document.querySelector('.editor-content').getBoundingClientRect();
            
            dropdownContainer.style.position = 'absolute';
            dropdownContainer.style.left = `${rect.left - editorRect.left}px`;
            dropdownContainer.style.top = `${rect.bottom - editorRect.top + 5}px`;
            
            // Add to DOM
            document.querySelector('.editor-content').appendChild(dropdownContainer);
            
            // Handle clicks outside the dropdown
            const handleDateOutsideClick = (e) => {
              if (!dropdownContainer.contains(e.target) && e.target !== tagElement) {
                if (dropdownContainer.parentNode) {
                  dropdownContainer.parentNode.removeChild(dropdownContainer);
                  document.removeEventListener('click', handleDateOutsideClick);
                }
              }
            };
            
            // Add click listener
            setTimeout(() => {
              document.addEventListener('click', handleDateOutsideClick);
            }, 10);
            
            event.preventDefault();
            event.stopPropagation();
          } catch (error) {
            console.error('Error handling due date cell click:', error);
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
        rows: 2,
        cols: 2,
        withHeaderRow: true
      }).run();
      
      // Focus first cell
      setTimeout(() => {
        editor.chain().focus().selectCell(0, 0).run();
      }, 50);
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
    if (command && command.action && editor) {
      // Create a new transaction
      const { state } = editor.view
      const { tr } = state
      
      // If we have a valid range, delete the slash character first
      if (range) {
        editor.chain()
          .focus()
          .deleteRange({
            from: range.from - 1, // Start from the slash character position
            to: range.to         // End at the current position
          })
          .run()
      }
      
      // Execute the command action with the editor and range
      command.action({ editor, range })
      
      // Ensure the editor maintains focus
      editor.commands.focus()
      
      // Hide the slash commands menu
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
        resizable: false,
        allowTableNodeSelection: false,
        HTMLAttributes: {
          class: 'editor-table',
        },
        handleWidth: 0,
        handleDuration: 0,
        cellMinWidth: 80
      }),
      TableRow.configure(),
      TableHeader.configure(),
      TableCell.configure({
        HTMLAttributes: ({ column, row }) => {
          // Return a style object for specific cells
          // console.log('TableCell configure', { column, row })

          // Skip headers (row 0)
          if (row === 0) {
            return { class: 'header-cell', contenteditable: 'false' };
          }

          // Customize based on column index:
          // Priority column (4)
          if (column === 3) {
            return {
              class: 'priority-cell',
              contenteditable: 'false',
              'data-column-type': 'priority',
              style: 'background-color: transparent !important; cursor: pointer; user-select: none;'
            };
          }
          
          // Status column (2)
          if (column === 1) {
            return {
              class: 'status-cell',
              contenteditable: 'false',
              'data-column-type': 'status',
              style: 'background-color: transparent !important; cursor: pointer; user-select: none;'
            };
          }

          // Due Date column (3)
          if (column === 2) {
            return {
              class: 'due-date-cell',
              contenteditable: 'false',
              'data-column-type': 'due-date',
              style: 'background-color: transparent !important; cursor: pointer; user-select: none;'
            };
          }

          // Default attributes
          return { class: 'data-cell' };
        }
      }),
      Underline,
      Strike,
      PriorityDropdown,
      StatusDropdown,
      DueDatePicker,
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
          // Check if clicked on .priority-tag-wrapper
          let targetElem = event.target;
          
          // Check if it's the tag or inside a table cell
          const isTagClick = targetElem.classList && targetElem.classList.contains('priority-tag-wrapper');
          const cell = targetElem.closest('td');
          
          if (isTagClick || (cell && cell.classList.contains('priority-cell'))) {
            try {
              console.log('Detected click on priority tag/cell');
              
              // If we clicked on a cell, find the tag inside it
              let tagElement = isTagClick ? targetElem : cell.querySelector('.priority-tag-wrapper');
              
              // If there's no tag element yet, use the cell
              const actualTagElement = tagElement || cell;
              
              // Get current priority from the tag if available
              let currentPriority = "Not Set";
              if (tagElement) {
                currentPriority = tagElement.getAttribute('data-value') || tagElement.textContent;
              } else if (cell) {
                currentPriority = cell.getAttribute('data-priority') || cell.textContent.trim();
              }
              
              console.log("Current priority:", currentPriority);
              
              // Remove any existing dropdown
              const existingDropdown = document.querySelector('.priority-dropdown-fixed');
              if (existingDropdown) {
                existingDropdown.parentNode.removeChild(existingDropdown);
              }
              
              // Create dropdown container with fixed positioning
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
            } catch (error) {
              console.error('Error handling priority cell click:', error);
            }
          }
          return false;
        }
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
        
        // Add options
        priorityOptions.forEach(option => {
          const optionElement = document.createElement('div');
          optionElement.className = `priority-option ${option.value === currentPriority ? 'selected' : ''}`;
          
          const tagSpan = document.createElement('div');
          tagSpan.className = 'priority-tag';
          tagSpan.textContent = option.value;
          tagSpan.style.backgroundColor = option.backgroundColor;
          tagSpan.style.color = "black";
          tagSpan.setAttribute('data-value', option.value);
          
          optionElement.appendChild(tagSpan);
          
          // Add click handler
          optionElement.addEventListener('click', () => {
            // Update cell attributes
            cellElement.setAttribute('data-priority', option.value);
            cellElement.setAttribute('data-priority-color', option.color || "black");
            cellElement.setAttribute('data-priority-bg', option.backgroundColor);
            cellElement.style.backgroundColor = 'transparent';
            
            // Update tag
            tagElement.textContent = option.value;
            tagElement.style.backgroundColor = option.backgroundColor;
            tagElement.style.color = "black";
            tagElement.setAttribute('data-value', option.value);
            
            // Animation and cleanup
            dropdownContainer.style.opacity = '0';
            dropdownContainer.style.transform = 'translateY(-3px)';
            setTimeout(() => {
              if (dropdownContainer.parentNode) {
                dropdownContainer.parentNode.removeChild(dropdownContainer);
                document.removeEventListener('click', handlePriorityOutsideClick);
              }
            }, 150);
            
            // Update document model
            try {
              if (editor) {
                const { state } = editor.view;
                const { tr } = state;
                const posInfo = editor.view.posAtDOM(cellElement, 0);
                
                if (posInfo) {
                  // Find cell node
                  let cellPos = null;
                  state.doc.nodesBetween(posInfo, posInfo + 100, (node, pos) => {
                    if (node.type.name === 'tableCell' && !cellPos) {
                      cellPos = pos;
                      return false;
                    }
                    return true;
                  });
                  
                  if (cellPos !== null) {
                    // Create paragraph with text
                    const schema = state.schema;
                    const paragraph = schema.nodes.paragraph.create(
                      null,
                      schema.text(option.value)
                    );
                    
                    // Replace cell content
                    tr.replaceWith(
                      cellPos + 1, 
                      cellPos + state.doc.nodeAt(cellPos).content.size + 1,
                      paragraph
                    );
                    
                    editor.view.dispatch(tr);
                  }
                }
              }
            } catch (err) {
              console.error("Error updating document model:", err);
            }
          });
          
          optionsContainer.appendChild(optionElement);
        });
        
        dropdownContainer.appendChild(optionsContainer);
        
        // Position dropdown
        const rect = tagElement.getBoundingClientRect();
        const editorRect = editorElement.getBoundingClientRect();
        
        dropdownContainer.style.position = 'absolute';
        dropdownContainer.style.left = `${rect.left - editorRect.left}px`;
        dropdownContainer.style.top = `${rect.bottom - editorRect.top + 5}px`;
        
        // Add to editor
        editorElement.appendChild(dropdownContainer);
        
        // Handle outside clicks
        const handlePriorityOutsideClick = (e) => {
          if (!dropdownContainer.contains(e.target) && e.target !== tagElement) {
            if (dropdownContainer.parentNode) {
              dropdownContainer.parentNode.removeChild(dropdownContainer);
              document.removeEventListener('click', handlePriorityOutsideClick);
            }
          }
        };
        
        // Add click listener
        setTimeout(() => {
          document.addEventListener('click', handlePriorityOutsideClick);
        }, 10);
        
        event.preventDefault();
        event.stopPropagation();
      }
      
      // Handle status tag clicks
      if (event.target.classList.contains('status-tag-wrapper') || 
          event.target.closest('.status-tag-wrapper')) {
        const tagElement = event.target.classList.contains('status-tag-wrapper') ? 
                           event.target : event.target.closest('.status-tag-wrapper');
        
        // Get the cell element
        const cellElement = tagElement.closest('td');
        if (!cellElement) return;
        
        console.log('Status tag clicked');
        
        // Get current status
        const currentStatus = cellElement.getAttribute('data-status') || 
                             tagElement.textContent.trim() || 
                             "Todo";
        
        // Create dropdown
        const editorElement = document.querySelector('.editor-content');
        if (!editorElement) return;
        
        // Create dropdown container
        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'status-dropdown-fixed';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'status-dropdown-header';
        header.textContent = 'STATUS';
        dropdownContainer.appendChild(header);
        
        // Create options container
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'status-dropdown-options';
        
        // Add options
        statusOptions.forEach(option => {
          const optionElement = document.createElement('div');
          optionElement.className = `status-option ${option.value === currentStatus ? 'selected' : ''}`;
          
          const tagSpan = document.createElement('div');
          tagSpan.className = 'status-tag';
          tagSpan.textContent = option.value;
          tagSpan.style.backgroundColor = option.backgroundColor;
          tagSpan.style.color = "black";
          tagSpan.setAttribute('data-value', option.value);
          
          optionElement.appendChild(tagSpan);
          
          // Add click handler
          optionElement.addEventListener('click', () => {
            // Update cell attributes
            cellElement.setAttribute('data-status', option.value);
            cellElement.setAttribute('data-status-color', option.color || "black");
            cellElement.setAttribute('data-status-bg', option.backgroundColor);
            cellElement.style.backgroundColor = 'transparent';
            
            // Update tag
            tagElement.textContent = option.value;
            tagElement.style.backgroundColor = option.backgroundColor;
            tagElement.style.color = "black";
            tagElement.setAttribute('data-value', option.value);
            
            // Animation and cleanup
            dropdownContainer.style.opacity = '0';
            dropdownContainer.style.transform = 'translateY(-3px)';
            setTimeout(() => {
              if (dropdownContainer.parentNode) {
                dropdownContainer.parentNode.removeChild(dropdownContainer);
                document.removeEventListener('click', handleStatusOutsideClick);
              }
            }, 150);
            
            // Update document model
            try {
              if (editor) {
                const { state } = editor.view;
                const { tr } = state;
                const posInfo = editor.view.posAtDOM(cellElement, 0);
                
                if (posInfo) {
                  // Find cell node
                  let cellPos = null;
                  state.doc.nodesBetween(posInfo, posInfo + 100, (node, pos) => {
                    if (node.type.name === 'tableCell' && !cellPos) {
                      cellPos = pos;
                      return false;
                    }
                    return true;
                  });
                  
                  if (cellPos !== null) {
                    // Create paragraph with text
                    const schema = state.schema;
                    const paragraph = schema.nodes.paragraph.create(
                      null,
                      schema.text(option.value)
                    );
                    
                    // Replace cell content
                    tr.replaceWith(
                      cellPos + 1, 
                      cellPos + state.doc.nodeAt(cellPos).content.size + 1,
                      paragraph
                    );
                    
                    editor.view.dispatch(tr);
                  }
                }
              }
            } catch (err) {
              console.error("Error updating document model:", err);
            }
          });
          
          optionsContainer.appendChild(optionElement);
        });
        
        dropdownContainer.appendChild(optionsContainer);
        
        // Position dropdown
        const rect = tagElement.getBoundingClientRect();
        const editorRect = editorElement.getBoundingClientRect();
        
        dropdownContainer.style.position = 'absolute';
        dropdownContainer.style.left = `${rect.left - editorRect.left}px`;
        dropdownContainer.style.top = `${rect.bottom - editorRect.top + 5}px`;
        
        // Add to editor
        editorElement.appendChild(dropdownContainer);
        
        // Handle outside clicks
        const handleStatusOutsideClick = (e) => {
          if (!dropdownContainer.contains(e.target) && e.target !== tagElement) {
            if (dropdownContainer.parentNode) {
              dropdownContainer.parentNode.removeChild(dropdownContainer);
              document.removeEventListener('click', handleStatusOutsideClick);
            }
          }
        };
        
        // Add click listener
        setTimeout(() => {
          document.addEventListener('click', handleStatusOutsideClick);
        }, 10);
        
        event.preventDefault();
        event.stopPropagation();
      }
      
      // Handle due date tag clicks
      if (event.target.classList.contains('due-date-tag-wrapper') || 
          event.target.closest('.due-date-tag-wrapper')) {
        const tagElement = event.target.classList.contains('due-date-tag-wrapper') ? 
                           event.target : event.target.closest('.due-date-tag-wrapper');
        
        // Get the cell element
        const cellElement = tagElement.closest('td');
        if (!cellElement) return;
        
        console.log('Due date tag clicked');
        
        // Get current date
        const currentDate = cellElement.getAttribute('data-date') || 
                           tagElement.textContent.trim() || '';
        
        const dateObj = parseDate(currentDate);
        
        // Create datepicker
        const editorElement = document.querySelector('.editor-content');
        if (!editorElement) return;
        
        // Create dropdown container
        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'calendar-dropdown-fixed';
        
        // Create calendar component
        const createCalendar = (year, month, selectedDate) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
          
          const firstDay = new Date(year, month, 1);
          const lastDay = new Date(year, month + 1, 0);
          const daysInMonth = lastDay.getDate();
          const startDayOfWeek = firstDay.getDay();
          
          // Month navigation
          const prevMonth = month === 0 ? 
            { month: 11, year: year - 1 } : 
            { month: month - 1, year };
          
          const nextMonth = month === 11 ? 
            { month: 0, year: year + 1 } : 
            { month: month + 1, year };
          
          // Create the month selector
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December'];
          
          const monthContainer = document.createElement('div');
          monthContainer.className = 'calendar-header';
          
          // Previous month button - only enable if the month is current or future
          const prevButton = document.createElement('button');
          prevButton.innerHTML = '&lt;';
          prevButton.className = 'calendar-nav-button';
          
          // Disable previous month button if it would navigate to a past month
          const isPrevMonthInPast = (prevMonth.year < today.getFullYear()) || 
                                    (prevMonth.year === today.getFullYear() && prevMonth.month < today.getMonth());
          if (isPrevMonthInPast) {
            prevButton.disabled = true;
            prevButton.classList.add('disabled');
          }
          
          prevButton.addEventListener('click', (e) => {
            if (prevButton.disabled) return;
            e.stopPropagation();
            calendarContainer.innerHTML = '';
            calendarContainer.appendChild(
              createCalendar(prevMonth.year, prevMonth.month, selectedDate)
            );
          });
          
          // Month and year display
          const monthDisplay = document.createElement('div');
          monthDisplay.className = 'calendar-month-year';
          monthDisplay.textContent = `${monthNames[month]} ${year}`;
          
          // Next month button
          const nextButton = document.createElement('button');
          nextButton.innerHTML = '&gt;';
          nextButton.className = 'calendar-nav-button';
          nextButton.addEventListener('click', (e) => {
            e.stopPropagation();
            calendarContainer.innerHTML = '';
            calendarContainer.appendChild(
              createCalendar(nextMonth.year, nextMonth.month, selectedDate)
            );
          });
          
          monthContainer.appendChild(prevButton);
          monthContainer.appendChild(monthDisplay);
          monthContainer.appendChild(nextButton);
          
          // Create weekday headers
          const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
          const weekdayRow = document.createElement('div');
          weekdayRow.className = 'calendar-weekdays';
          
          weekDays.forEach(day => {
            const dayCell = document.createElement('div');
            dayCell.className = 'weekday-cell';
            dayCell.textContent = day;
            weekdayRow.appendChild(dayCell);
          });
          
          // Create grid of days
          const daysGrid = document.createElement('div');
          daysGrid.className = 'calendar-days';
          
          // Add empty cells for days before the first of the month
          for (let i = 0; i < startDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            daysGrid.appendChild(emptyCell);
          }
          
          // Add days of the month
          for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.textContent = i;
            
            // Check if this day is in the past
            const cellDate = new Date(year, month, i);
            cellDate.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
            const isPastDay = cellDate < today;
            
            if (isPastDay) {
              dayCell.classList.add('past-day');
              dayCell.classList.add('disabled');
            }
            
            // Check if this day is today
            const isToday = cellDate.getTime() === today.getTime();
            if (isToday) {
              dayCell.classList.add('today');
            }
            
            // Check if this day is selected
            if (selectedDate && 
                selectedDate.getDate() === i && 
                selectedDate.getMonth() === month && 
                selectedDate.getFullYear() === year) {
              dayCell.classList.add('selected');
            }
            
            // Add click handler to select this date
            dayCell.addEventListener('click', (e) => {
              // Skip if this is a past date
              if (isPastDay) return;
              
              e.stopPropagation();
              
              const newDate = new Date(year, month, i);
              const formattedDate = formatDate(newDate);
              
              // Update cell attributes and tag content
              cellElement.setAttribute('data-date', formattedDate);
              
              if (tagElement) {
                tagElement.textContent = formattedDate;
              }
              
              // Also update the document model
              try {
                const { state } = view;
                const { tr } = state;
                const posInfo = view.posAtDOM(cellElement, 0);
                
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
                    // Create a paragraph with the date text
                    const schema = state.schema;
                    const paragraph = schema.nodes.paragraph.create(
                      null,
                      schema.text(formattedDate)
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
              
              // Close the calendar with animation
              dropdownContainer.style.opacity = '0';
              dropdownContainer.style.transform = 'translateY(-3px)';
              
              setTimeout(() => {
                if (dropdownContainer.parentNode) {
                  dropdownContainer.parentNode.removeChild(dropdownContainer);
                  document.removeEventListener('click', handleDateOutsideClick);
                }
              }, 150);
            });
            
            daysGrid.appendChild(dayCell);
          }
          
          // Create the calendar container
          const container = document.createElement('div');
          container.className = 'calendar-container';
          container.appendChild(monthContainer);
          container.appendChild(weekdayRow);
          container.appendChild(daysGrid);
          
          // Add buttons for quick actions
          const actionBar = document.createElement('div');
          actionBar.className = 'calendar-action-bar';
          
          // Today button
          const todayButton = document.createElement('button');
          todayButton.className = 'calendar-action-button';
          todayButton.textContent = 'Today';
          todayButton.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Set to today's date
            const today = new Date();
            const formattedToday = formatDate(today);
            
            // Update cell attributes and tag content
            cellElement.setAttribute('data-date', formattedToday);
            
            if (tagElement) {
              tagElement.textContent = formattedToday;
            }
            
            // Also update the document model
            try {
              const { state } = view;
              const { tr } = state;
              const posInfo = view.posAtDOM(cellElement, 0);
              
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
                  // Create a paragraph with the date text
                  const schema = state.schema;
                  const paragraph = schema.nodes.paragraph.create(
                    null,
                    schema.text(formattedToday)
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
            
            // Close the calendar with animation
            dropdownContainer.style.opacity = '0';
            dropdownContainer.style.transform = 'translateY(-3px)';
            
            setTimeout(() => {
              if (dropdownContainer.parentNode) {
                dropdownContainer.parentNode.removeChild(dropdownContainer);
                document.removeEventListener('click', handleDateOutsideClick);
              }
            }, 150);
          });
          
          // Clear button
          const clearButton = document.createElement('button');
          clearButton.className = 'calendar-action-button clear';
          clearButton.textContent = 'Clear';
          clearButton.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Clear date
            cellElement.setAttribute('data-date', '');
            
            if (tagElement) {
              tagElement.textContent = 'Select date';
            }
            
            // Also update the document model
            try {
              const { state } = view;
              const { tr } = state;
              const posInfo = view.posAtDOM(cellElement, 0);
              
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
                  // Create an empty paragraph
                  const schema = state.schema;
                  const paragraph = schema.nodes.paragraph.create(
                    null,
                    schema.text('')
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
            
            // Close the calendar with animation
            dropdownContainer.style.opacity = '0';
            dropdownContainer.style.transform = 'translateY(-3px)';
            
            setTimeout(() => {
              if (dropdownContainer.parentNode) {
                dropdownContainer.parentNode.removeChild(dropdownContainer);
                document.removeEventListener('click', handleDateOutsideClick);
              }
            }, 150);
          });
          
          actionBar.appendChild(todayButton);
          actionBar.appendChild(clearButton);
          container.appendChild(actionBar);
          
          return container;
        };
        
        // Determine initial date to show in calendar
        let initialDate = new Date();
        if (dateObj) {
          initialDate = dateObj;
        }
        
        // Create calendar and add to dropdown
        const month = initialDate.getMonth();
        const year = initialDate.getFullYear();
        const calendarContainer = document.createElement('div');
        calendarContainer.appendChild(createCalendar(year, month, dateObj));
        dropdownContainer.appendChild(calendarContainer);
        
        // Position dropdown
        const rect = tagElement.getBoundingClientRect();
        const editorRect = editorElement.getBoundingClientRect();
        
        dropdownContainer.style.position = 'absolute';
        dropdownContainer.style.left = `${rect.left - editorRect.left}px`;
        dropdownContainer.style.top = `${rect.bottom - editorRect.top + 5}px`;
        
        // Add to DOM
        document.querySelector('.editor-content').appendChild(dropdownContainer);
        
        // Handle outside clicks
        const handleDateOutsideClick = (e) => {
          if (!dropdownContainer.contains(e.target) && e.target !== tagElement) {
            if (dropdownContainer.parentNode) {
              dropdownContainer.parentNode.removeChild(dropdownContainer);
              document.removeEventListener('click', handleDateOutsideClick);
            }
          }
        };
        
        // Add click listener
        setTimeout(() => {
          document.addEventListener('click', handleDateOutsideClick);
        }, 10);
        
        event.preventDefault();
        event.stopPropagation();
      }
    };
    
    document.addEventListener('click', handleTagClicks);
    
    return () => {
      document.removeEventListener('click', handleTagClicks);
    };
  }, [editor]);

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