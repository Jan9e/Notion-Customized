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
                  
                  // Only add the button if the heading contains text
                  if (headingText && headingText.trim()) {
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
  
  // Assemble button
  button.appendChild(iconContainer);
  button.appendChild(text_span);
  container.appendChild(button);
  
  // Handle click - open the goal details
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // Create a goal object from the text
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
    
    // Call the handler with the goal data
    handleOpenGoal(goalData);
  });
  
  return container;
} 