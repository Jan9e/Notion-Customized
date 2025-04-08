import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { ReactDOM } from 'react-dom';
import GoalOpenButton from '../GoalOpenButton';
import React from 'react';

// Maintain a list of recently created headings (via slash command) to ignore
let recentlyCreatedHeadings = new Set();
let recentlyCreatedTables = new Set();

// Clear older entries periodically
setInterval(() => {
  recentlyCreatedHeadings.clear();
  recentlyCreatedTables.clear();
}, 10000); // Clear every 10 seconds

export default function createGoalExtension(handleOpenGoal) {
  return Extension.create({
    name: 'goalExtension',
    
    onBeforeCreate() {
      // Filter for goal-state-changed events at the extension level
      const goalStateHandler = (event) => {
        if (event.detail && event.detail.goalId) {
          // Skip direct-created goals at the extension level
          if (event.detail.goalId.startsWith('goal-direct-') || 
              event.detail.goalId.startsWith('goal-new-goal-')) {
            console.log(`Extension ignoring event for direct-created goal: ${event.detail.goalId}`);
            event.stopPropagation(); // Stop event from triggering other handlers
            event.stopImmediatePropagation(); // Stop other handlers on this element
            return false;
          }
        }
      };
      
      // Add the filter early to catch events
      document.addEventListener('goal-state-changed', goalStateHandler, { capture: true });
      
      // Store reference for cleanup
      this._goalStateFilter = goalStateHandler;
    },
    
    onDestroy() {
      // Clean up the event listener when extension is destroyed
      if (this._goalStateFilter) {
        document.removeEventListener('goal-state-changed', this._goalStateFilter, { capture: true });
      }
    },
    
    // Add a handler for the slash command to track when elements are created
    addKeyboardShortcuts() {
      return {
        '/': () => {
          // Record the current selection position
          const { $head } = this.editor.state.selection;
          const position = $head.pos;
          
          // Store this position as potentially becoming a heading or table
          setTimeout(() => {
            // Check for heading
            const node = this.editor.view.state.doc.nodeAt(position);
            if (node && node.type.name === 'heading') {
              recentlyCreatedHeadings.add(position);
              
              // Remove from tracking after 5 seconds
              setTimeout(() => {
                recentlyCreatedHeadings.delete(position);
              }, 5000);
            }
            
            // Check if a table was created nearby
            this.editor.view.state.doc.nodesBetween(
              Math.max(0, position - 10),
              Math.min(this.editor.view.state.doc.content.size, position + 100),
              (node, pos) => {
                if (node.type.name === 'table') {
                  console.log('Table detected near slash command position');
                  recentlyCreatedTables.add(pos);
                  
                  // Apply contenteditable attributes immediately using DOM methods
                  setTimeout(() => {
                    try {
                      const tableNode = this.editor.view.nodeDOM(pos);
                      if (tableNode && tableNode.tagName === 'TABLE') {
                        console.log('Found slash-created table - making it fully editable');
                        
                        // Add special indicator to make it independent from goal tables
                        tableNode.setAttribute('data-slash-created', 'true');
                        tableNode.classList.remove('goal-table');
                        
                        // Make sure the table can be edited
                        tableNode.setAttribute('contenteditable', 'true');
                        
                        // Make all cells editable - both directly and by setting contenteditable
                        const allCells = tableNode.querySelectorAll('td, th');
                        allCells.forEach(cell => {
                          // Set direct contenteditable attribute
                          cell.setAttribute('contenteditable', 'true');
                          cell.setAttribute('data-no-special-handling', 'true');
                          
                          // Set critical styles for editability
                          cell.style.userModify = 'read-write';
                          cell.style.webkitUserModify = 'read-write';
                          cell.style.mozUserModify = 'read-write';
                          cell.style.msUserSelect = 'text';
                          cell.style.webkitUserSelect = 'text';
                          cell.style.userSelect = 'text';
                          cell.style.pointerEvents = 'auto';
                          cell.style.cursor = 'text';
                          
                          // Special handling for columns 2-4 which may get special handling
                          const cellIndex = Array.from(cell.parentNode.children).indexOf(cell);
                          if (cellIndex >= 1 && cellIndex <= 3) { // 2nd, 3rd, 4th columns (0-indexed)
                            cell.classList.add('regular-column');
                            cell.setAttribute('data-regular-column', 'true');
                            cell.setAttribute('data-special-column-bypass', 'true');
                            
                            // Even more aggressive override for these specific columns
                            cell.style.cssText += `
                              -webkit-user-modify: read-write !important;
                              -moz-user-modify: read-write !important;
                              user-modify: read-write !important;
                              contenteditable: true !important;
                              -webkit-user-select: text !important;
                              -moz-user-select: text !important;
                              -ms-user-select: text !important;
                              user-select: text !important;
                              cursor: text !important;
                              background-color: white !important;
                              text-align: left !important;
                            `;
                            
                            // Add inline script to ensure it remains editable
                            // (This is a last resort but might be necessary)
                            const pElement = cell.querySelector('p') || document.createElement('p');
                            pElement.setAttribute('contenteditable', 'true');
                            pElement.style.cssText += `
                              -webkit-user-modify: read-write !important;
                              -moz-user-modify: read-write !important;
                              user-modify: read-write !important;
                              contenteditable: true !important;
                              cursor: text !important;
                            `;
                          }
                          
                          // Remove any special classes or attributes
                          cell.classList.remove('priority-cell', 'status-cell', 'due-date-cell');
                          cell.removeAttribute('data-priority');
                          cell.removeAttribute('data-status');
                          cell.removeAttribute('data-due-date');
                          
                          // Make sure paragraph is editable too
                          const p = cell.querySelector('p') || document.createElement('p');
                          if (!cell.querySelector('p')) {
                            p.textContent = cell.textContent || '';
                            cell.innerHTML = '';
                            cell.appendChild(p);
                          }
                          
                          p.setAttribute('contenteditable', 'true');
                          p.style.userModify = 'read-write';
                          p.style.webkitUserModify = 'read-write';
                          p.style.mozUserModify = 'read-write';
                          p.style.cursor = 'text';
                        });
                      }
                    } catch (e) {
                      console.error('Error making table cells editable:', e);
                    }
                  }, 100);
                  
                  // Remove from tracking after 20 seconds (longer time to ensure CSS applies and user can edit)
                  setTimeout(() => {
                    // Don't remove the data-slash-created attribute, just stop tracking them
                    // This ensures ongoing edits won't be affected by decoration updates
                    recentlyCreatedTables.delete(pos);
                    
                    console.log('Table removed from tracking but keeping data-slash-created attribute');
                  }, 20000);
                }
              }
            );
          }, 500); // Check after a delay to allow the command to complete
          
          return false; // Don't handle the command, just track it
        }
      };
    },
    
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey('goalExtension'),
          
          props: {
            decorations(state) {
              const { doc } = state;
              const decorations = [];
              
              // Track first cells of rows to identify title cells
              const firstCellsInRows = new Set();
              
              // Check if we're in a goal template
              let isGoalTemplate = false;
              
              // First find if this document contains a "Goals Tracker" heading
              doc.descendants((node, pos) => {
                if (node.type.name === 'heading' && node.textContent.trim() === 'Goals Tracker') {
                  isGoalTemplate = true;
                  return false; // Stop traversal once found
                }
                return true;
              });
              
              // First pass: add class to tables in goal templates and identify first cells
              doc.descendants((node, pos) => {
                // Handle tables - add goal-table class to tables in goal templates
                if (node.type.name === 'table') {
                  // Determine column count for this table
                  let columnCount = 0;
                  if (node.childCount > 0) {
                    const firstRow = node.child(0);
                    if (firstRow && firstRow.type.name === 'tableRow') {
                      columnCount = firstRow.childCount;
                    }
                  }
                  
                  // Check if this table was recently created via slash command
                  const isSlashCreatedTable = recentlyCreatedTables.has(pos);
                  
                  // Only style tables in goal templates with the goal-table class
                  if (isGoalTemplate) {
                    // Check if this looks like a goal table (has title 'Goal' in first cell of first row)
                    let isGoalTable = false;
                    
                    // Examine first row to check if it's a goal table
                    if (node.childCount > 0) {
                      const firstRow = node.child(0);
                      if (firstRow.type.name === 'tableRow' && firstRow.childCount > 0) {
                        const firstHeaderCell = firstRow.child(0);
                        if (firstHeaderCell && firstHeaderCell.textContent) {
                          const headerText = firstHeaderCell.textContent.trim().toLowerCase();
                          if (headerText === 'goal' || 
                              headerText === 'goal name' || 
                              headerText.includes('goal')) {
                            isGoalTable = true;
                          }
                        }
                      }
                    }
                    
                    // Apply the goal-table class if it's a goal table or we're in a goal template
                    decorations.push(
                      Decoration.node(pos, pos + node.nodeSize, {
                        class: 'goal-table'
                      })
                    );
                  } else {
                    // For non-goal tables, add column count to help with CSS styling
                    // Also add a special attribute for slash-created tables
                    const tableAttrs = {
                      'data-column-count': columnCount
                    };
                    
                    // Add a special attribute for slash-created tables
                    if (isSlashCreatedTable) {
                      tableAttrs['data-slash-created'] = 'true';
                      
                      // For slash-created tables, we only want to add the attribute
                      // and avoid any additional decorations that might interfere with editing
                      decorations.push(
                        Decoration.node(pos, pos + node.nodeSize, tableAttrs)
                      );
                      return true; // Skip additional processing for this table to prevent any interference with editing
                    } else {
                      decorations.push(
                        Decoration.node(pos, pos + node.nodeSize, tableAttrs)
                      );
                    }
                  }
                }
                
                // Track table rows
                if (node.type.name === 'tableRow') {
                  // Find the first cell in this row
                  if (node.childCount > 0) {
                    const firstCell = node.child(0);
                    if (firstCell.type.name === 'tableCell' || firstCell.type.name === 'tableHeader') {
                      // Store position + 1 (to get inside the cell)
                      firstCellsInRows.add(pos + 1);
                    }
                  }
                }
                
                return true;
              });
              
              // Second pass: add decorations for headings and cells
              doc.descendants((node, pos) => {
                // Check if the node is a heading level 1 or 2
                if (node.type.name === 'heading' && (node.attrs.level === 1 || node.attrs.level === 2)) {
                  const headingText = node.textContent;
                  
                  // Skip if this is the Goals Tracker heading
                  if (headingText.trim() === 'Goals Tracker') {
                    return true;
                  }
                  
                  // Skip recently created headings (from slash commands) if not in a goal template
                  if (!isGoalTemplate && recentlyCreatedHeadings.has(pos)) {
                    return true;
                  }
                  
                  // Only add goal buttons to headings in goal templates unless
                  // the heading explicitly looks like a goal
                  const looksLikeGoalHeading = headingText.includes('Goal:') || 
                                              /goal\s+\d+/i.test(headingText) ||
                                              /milestone\s+\d+/i.test(headingText);
                  
                  if (!isGoalTemplate && !looksLikeGoalHeading) {
                    return true;
                  }
                  
                  // Only add the button if the heading contains text
                  if (headingText && headingText.trim()) {
                    // Check if heading has the no-button attribute
                    const hasNoButtonAttribute = node.attrs && 
                                               node.attrs.HTMLAttributes && 
                                               node.attrs.HTMLAttributes['data-no-goal-button'] === 'true';
                    
                    if (hasNoButtonAttribute) {
                      return true;
                    }
                    
                    // Find the position after the text content but inside the heading
                    const textEnd = pos + node.nodeSize - 1;
                    
                    // Create a decoration that applies to the heading node itself
                    decorations.push(
                      Decoration.widget(textEnd, (view, getPos) => {
                        return createGoalButton(headingText, handleOpenGoal, 'heading');
                      })
                    );
                  }
                }
                // Check if this is a table cell that might contain a goal title
                else if ((node.type.name === 'tableCell' || node.type.name === 'tableHeader')) {
                  // Check if this cell is in a slash-created table
                  let isInSlashCreatedTable = false;
                  
                  // Check parent nodes to see if this cell is in a slash-created table
                  doc.nodesBetween(Math.max(0, pos - 100), pos, (n, p) => {
                    if (n.type.name === 'table' && recentlyCreatedTables.has(p)) {
                      isInSlashCreatedTable = true;
                      return false; // Stop traversal
                    }
                    return true;
                  });
                  
                  // Skip adding decorations to cells in slash-created tables completely
                  if (isInSlashCreatedTable) {
                    return true; // Skip processing entirely to ensure normal cell editing
                  }
                  
                  // Check if this is the first cell in a row (goal title column)
                  const isTitleCell = Array.from(firstCellsInRows).some(rowPos => {
                    // Check if this cell is exactly at the row position we stored
                    return pos === rowPos;
                  });
                  
                  // Skip if this cell is not in a goal template and not a title cell
                  if (!isGoalTemplate && !isTitleCell) {
                    return true;
                  }
                  
                  if (isTitleCell) {
                    const cellContent = node.textContent.trim();
                    
                    // Special handling for "Add new goal" cell
                    if (cellContent && cellContent.includes('Add new goal')) {
                      decorations.push(
                        Decoration.node(pos, pos + node.nodeSize, {
                          class: 'add-new-goal-cell'
                        })
                      );
                      return true;
                    }
                    
                    // Only add button to non-empty cells that aren't headers (unless it's a header with real content)
                    if (cellContent && 
                        cellContent !== 'Goal' && 
                        cellContent !== 'Goal Name' &&
                        !cellContent.includes('Add new goal') &&
                        cellContent.length > 0 && 
                        cellContent.length < 100) {
                      
                      // Add a widget at the start of the cell to ensure consistent placement
                      decorations.push(
                        Decoration.widget(pos + 1, (view, getPos) => {
                          return createGoalButton(cellContent, handleOpenGoal, 'table');
                        }, { side: 1 }) // side: 1 means insert after
                      );
                      
                      // Add the goal-title-cell class to the cell
                      decorations.push(
                        Decoration.node(pos, pos + node.nodeSize, {
                          class: 'goal-title-cell'
                        })
                      );
                    }
                  }
                }
                
                return true;
              });
              
              return DecorationSet.create(state.doc, decorations);
            }
          }
        }),
        
        // Plugin to handle clicks on the Add new goal cell
        new Plugin({
          props: {
            handleDOMEvents: {
              click: (view, event) => {
                // Find the nearest table cell or header to the click
                let targetElement = event.target;
                let foundCell = false;
                
                // Traverse up the DOM tree to find a table cell
                while (targetElement && !foundCell) {
                  if (targetElement.classList && targetElement.classList.contains('add-new-goal-cell')) {
                    foundCell = true;
                    break;
                  }
                  
                  // Go up one level in the DOM
                  targetElement = targetElement.parentElement;
                  
                  // Safety check - don't go beyond the editor
                  if (!targetElement || targetElement === view.dom) {
                    break;
                  }
                }
                
                // If we found an "Add new goal" cell, handle the click
                if (foundCell) {
                  console.log('Add new goal cell clicked - creating row directly');
                  
                  // Prevent event propagation immediately
                  event.preventDefault();
                  event.stopPropagation();
                  
                  try {
                    // Find the table and the "Add new goal" row
                    let tablePos = null;
                    let addNewGoalRowPos = null;
                    
                    // Traverse up the DOM to find the table element
                    let tableElement = targetElement;
                    while (tableElement && tableElement.tagName !== 'TABLE') {
                      tableElement = tableElement.parentElement;
                    }
                    
                    if (!tableElement) {
                      console.error('Could not find table element');
                      return true;
                    }
                    
                    // Now we need to find the table in the document
                    view.state.doc.descendants((node, pos) => {
                      if (node.type.name === 'table') {
                        // Try to check if this table contains the Add new goal row
                        let containsAddNewGoal = false;
                        
                        node.descendants((rowNode, rowRelPos) => {
                          if (rowNode.type.name === 'tableRow' && 
                              rowNode.firstChild && 
                              rowNode.firstChild.textContent.includes('Add new goal')) {
                            containsAddNewGoal = true;
                            // Calculate absolute position
                            addNewGoalRowPos = pos + rowRelPos;
                            return false;
                          }
                          return true;
                        });
                        
                        if (containsAddNewGoal) {
                          tablePos = pos;
                          return false; // Stop traversal once found
                        }
                      }
                      return true;
                    });
                    
                    if (!tablePos || !addNewGoalRowPos) {
                      console.error('Could not find table or Add new goal row position');
                      return true;
                    }
                    
                    // Create a new row for the goal
                    const schema = view.state.schema;
                    const newRow = schema.nodes.tableRow.create(null, [
                      // Title cell
                      schema.nodes.tableCell.create(null, schema.nodes.paragraph.create(null, schema.text(`New Goal ${new Date().toLocaleDateString()}`))),
                      // Status cell
                      schema.nodes.tableCell.create(null, schema.nodes.paragraph.create(null, schema.text('Not Started'))),
                      // Due Date cell - ensure non-empty content
                      schema.nodes.tableCell.create(null, schema.nodes.paragraph.create(null, schema.text('--'))),
                      // Priority cell
                      schema.nodes.tableCell.create(null, schema.nodes.paragraph.create(null, schema.text('Medium'))),
                      // Team cell - ensure non-empty content
                      schema.nodes.tableCell.create(null, schema.nodes.paragraph.create(null, schema.text('--')))
                    ]);
                    
                    // Insert the new row before the "Add new goal" row
                    const tr = view.state.tr;
                    tr.insert(addNewGoalRowPos, newRow);
                    view.dispatch(tr);
                    
                    console.log('New goal row added directly');
                  } catch (error) {
                    console.error('Error creating new goal row:', error);
                  }
                  
                  return true;
                }
                
                return false;
              }
            }
          }
        })
      ];
    }
  });
}

// Helper function to create the goal button
function createGoalButton(text, handleOpenGoal, context = 'heading') {
  // Create a container for the button
  const container = document.createElement('span');
  container.className = 'goal-button-container';
  
  if (context === 'table') {
    container.className += ' table-goal-button';
    container.style.position = 'absolute';
    container.style.right = '8px';
    container.style.top = '50%';
    container.style.transform = 'translateY(-50%)';
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';
    container.style.zIndex = '10';
  } else {
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';
    container.style.marginLeft = '8px';
  }
  
  // Add unique identifier for the goal
  const goalId = `goal-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  container.setAttribute('data-goal-id', goalId);
  
  // Create the button element
  const button = document.createElement('button');
  button.className = `
    goal-open-button inline-flex items-center justify-center
    text-xs font-medium rounded 
    px-1.5 py-0.5
    transition-colors duration-150
    ${context === 'table' ? 'table-cell-button' : ''}
    bg-gray-100 text-gray-700 hover:bg-gray-200
  `;
  
  // Add the icon
  const iconContainer = document.createElement('span');
  iconContainer.className = 'goal-icon-container';
  iconContainer.innerHTML = `
    <svg 
      width="12" 
      height="12" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style="display: inline-block; vertical-align: middle;"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  `;
  
  // Add text
  const text_span = document.createElement('span');
  text_span.style.marginLeft = '4px';
  text_span.textContent = 'Open';
  
  // Function to update button state (will be called by the document event listener)
  const updateButtonState = (isOpen) => {
    console.log(`Updating button state for ${goalId} to ${isOpen ? 'open' : 'closed'}`);
    
    // Update our local tracking state
    isGoalOpen = isOpen;
    
    if (isOpen) {
      button.classList.add('is-open');
      button.classList.add('bg-indigo-100', 'text-indigo-700');
      button.classList.remove('bg-gray-100', 'text-gray-700');
      text_span.textContent = 'Close';
    } else {
      button.classList.remove('is-open');
      button.classList.remove('bg-indigo-100', 'text-indigo-700');
      button.classList.add('bg-gray-100', 'text-gray-700');
      text_span.textContent = 'Open';
    }
  };
  
  // Assemble button
  button.appendChild(iconContainer);
  button.appendChild(text_span);
  container.appendChild(button);
  
  // Create goal data object
  const goalData = {
    id: goalId,
    title: text,
    // You could extract other sections by parsing the document
    // This is simplified for demo purposes
    detail: '',
    metrics: '',
    timeline: '',
    priority: 'Medium', // Default priority
    dueDate: '', // Default due date
    actionItems: [],
    relatedFiles: []
  };
  
  // Listen for custom goal state events from the editor
  // Use a unique property on the container element to track if we've already attached a listener
  if (!container.hasOwnProperty('_hasGoalEventListener')) {
    // Flag to prevent multiple listeners on the same button
    container.setAttribute('_hasGoalEventListener', 'true');
    
    // Create a named event handler function that we can remove later if needed
    container._goalStateHandler = (event) => {
      if (event.detail && event.detail.goalId === goalId) {
        updateButtonState(event.detail.isOpen);
      }
    };
    
    // Add the event listener
    document.addEventListener('goal-state-changed', container._goalStateHandler);
    
    // Add a MutationObserver to detect when the button is removed from the DOM
    // This ensures we clean up event listeners when decorations are removed
    setTimeout(() => {
      if (document.contains(container)) {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
              // Check if the container was removed from the DOM
              if (!document.contains(container)) {
                // Clean up event listener
                document.removeEventListener('goal-state-changed', container._goalStateHandler);
                // Disconnect observer
                observer.disconnect();
              }
            }
          });
        });
        
        // Start observing the parent
        if (container.parentNode) {
          observer.observe(container.parentNode, { childList: true, subtree: true });
          // Store reference for cleanup
          container._observer = observer;
        }
      }
    }, 100);
  }
  
  // Track click state to prevent multiple rapid clicks
  let isProcessingClick = false;
  
  // Check if this goal is open initially
  let isGoalOpen = false;
  
  // Improved click handler to ensure it works with just one click and as a toggle
  const handleClick = (e) => {
    // Prevent the event from propagating
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Goal button clicked for:', goalData.title, 'Currently open:', isGoalOpen);
    
    // Prevent multiple rapid clicks - use a stronger check
    if (isProcessingClick) {
      console.log('Ignoring click - already processing');
      return false;
    }
    
    // Set processing flag
    isProcessingClick = true;
    
    // Visual feedback - disable button temporarily
    button.disabled = true;
    button.style.opacity = '0.7';
    button.style.cursor = 'wait';
    
    // Call the handler with the goal data and current state
    handleOpenGoal(goalData, isGoalOpen);
    
    // Clear the processing flag after a delay
    setTimeout(() => {
      isProcessingClick = false;
      
      // Re-enable button
      button.disabled = false;
      button.style.opacity = '1';
      button.style.cursor = 'pointer';
      
      console.log('Ready for next click');
    }, 500); // Increase to 500ms to be safe
    
    return false;
  };
  
  // Only use a single event binding approach
  button.onclick = handleClick;
  
  // Make sure we don't interfere with the editor when clicking elsewhere
  const stopPropagation = (e) => {
    e.stopPropagation();
  };
  
  button.addEventListener('mousedown', stopPropagation, { capture: true });
  container.addEventListener('mousedown', stopPropagation, { capture: true });
  
  return container;
} 