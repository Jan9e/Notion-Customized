import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { ReactDOM } from 'react-dom';
import GoalOpenButton from '../GoalOpenButton';
import React from 'react';

export default function createGoalExtension(handleOpenGoal) {
  return Extension.create({
    name: 'goalExtension',
    
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
              
              // First pass: identify first cell in each row
              doc.descendants((node, pos) => {
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
              
              // Second pass: add decorations
              doc.descendants((node, pos) => {
                // Check if the node is a heading level 1 or 2
                if (node.type.name === 'heading' && (node.attrs.level === 1 || node.attrs.level === 2)) {
                  const headingText = node.textContent;
                  
                  // Skip if this is the Goals Tracker heading
                  if (headingText.trim() === 'Goals Tracker') {
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
                  // Check if this is the first cell in a row (goal title column)
                  const isTitleCell = Array.from(firstCellsInRows).some(rowPos => {
                    // The node position should be a bit after the row position we stored
                    return Math.abs(pos - rowPos) < 10; // Approximate matching
                  });
                  
                  if (isTitleCell) {
                    const cellContent = node.textContent.trim();
                    
                    // Only add button to non-empty cells that aren't headers (unless it's a header with real content)
                    if (cellContent && 
                        cellContent !== 'Goal' && 
                        cellContent !== 'Goal Name' &&
                        !cellContent.includes('Add new goal') &&
                        cellContent.length > 0 && 
                        cellContent.length < 100) {
                      
                      // Instead of trying to position at the end of a paragraph,
                      // we'll use a node decoration to add a class to the cell
                      // and later position the button with CSS
                      decorations.push(
                        Decoration.node(pos, pos + node.nodeSize, {
                          class: 'goal-title-cell'
                        })
                      );
                      
                      // Add a widget at the start of the cell to ensure consistent placement
                      decorations.push(
                        Decoration.widget(pos + 1, (view, getPos) => {
                          return createGoalButton(cellContent, handleOpenGoal, 'table');
                        }, { side: 1 }) // side: 1 means insert after
                      );
                    }
                  }
                }
                
                return true;
              });
              
              return DecorationSet.create(state.doc, decorations);
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
  document.addEventListener('goal-state-changed', (event) => {
    if (event.detail && event.detail.goalId === goalId) {
      updateButtonState(event.detail.isOpen);
    }
  });
  
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