import { useState, useCallback } from 'react';
import Editor from './Editor';
import GoalPeek from '../GoalPeek';
import createGoalExtension from './GoalExtension';

// Helper to extract document sections
const extractGoalDetails = (editor, goalTitle) => {
  if (!editor) return null;
  
  // Get the document content
  const doc = editor.state.doc;
  const result = {
    id: `goal-${goalTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    title: goalTitle,
    detail: '',
    metrics: '',
    timeline: '',
    priority: 'Medium',  // Default priority
    dueDate: '',  // Default due date
    actionItems: [],
    relatedFiles: [],
    source: {
      type: 'unknown',
      position: null
    }
  };
  
  // Keep track of the current section
  let currentSection = null;
  let collectingItems = false;
  let startPos = null;
  let isInTableCell = false;
  let tableRowPos = null;
  
  // First, try to find the goal in a table
  let foundInTable = false;
  let tableGoalData = null;
  
  doc.descendants((node, pos) => {
    // Check for table cells that might contain our goal title
    if (node.type.name === 'tableCell') {
      const cellContent = node.textContent.trim();
      
      // If this cell contains the goal title
      if (cellContent === goalTitle) {
        foundInTable = true;
        
        // Remember that we found it in a table
        result.source = {
          type: 'table',
          position: pos
        };
        
        // Try to find other cells in the same row for additional data
        const row = node.parent;
        if (row && row.type.name === 'tableRow') {
          tableRowPos = pos - node.attrs.colwidth.reduce((a, b) => a + b, 0);
          
          // Go through cells in this row
          row.forEach((cell, cellIndex) => {
            const text = cell.textContent.trim();
            
            // Skip the title cell (which we already found)
            if (text === goalTitle) return;
            
            // Try to identify what kind of data is in this cell based on position or content
            // This is a heuristic - you may need to adjust based on your table structure
            if (cellIndex === 1) {
              // Second column might be priority
              result.priority = text || 'Medium';
            } else if (cellIndex === 2) {
              // Third column might be due date
              result.dueDate = text || '';
            } else if (cellIndex === 3) {
              // Fourth column might be details
              result.detail = text || '';
            }
          });
        }
        
        // Store this for potential update later
        tableGoalData = {
          row: row,
          position: tableRowPos,
          titleCellIndex: node.attrs.colspan - 1
        };
        
        // No need to continue searching
        return false;
      }
    }
    
    return true;
  });
  
  // If we found it in a table, return the table-specific data
  if (foundInTable) {
    return result;
  }
  
  // If not found in a table, look for it in headings (original behavior)
  doc.descendants((node, pos) => {
    // Check for headings
    if (node.type.name === 'heading') {
      const text = node.textContent.trim();
      
      // Check if it matches our goal title
      if (text === goalTitle) {
        // Store position to search from here
        startPos = pos;
        
        // Remember that we found it in a heading
        result.source = {
          type: 'heading',
          position: pos
        };
      }
      // If we found the title, look for specific section headings
      else if (startPos !== null) {
        // Reset current section
        collectingItems = false;
        
        // Check for our specific sections
        if (text === 'Detail') {
          currentSection = 'detail';
        } else if (text.includes('Success Metric')) {
          currentSection = 'metrics';
        } else if (text === 'Timeline') {
          currentSection = 'timeline';
        } else if (text === 'Priority') {
          currentSection = 'priority';
        } else if (text === 'Due Date') {
          currentSection = 'dueDate';
        } else if (text === 'Action Plan') {
          currentSection = 'actionItems';
          collectingItems = true;
        } else if (text === 'Related files') {
          currentSection = 'relatedFiles';
          collectingItems = true;
        } else {
          // A different heading - stop collecting for this goal
          currentSection = null;
        }
      }
    }
    // If we're in a section, collect its content
    else if (currentSection && startPos !== null) {
      // For paragraphs, collect the text
      if (node.type.name === 'paragraph') {
        const text = node.textContent.trim();
        if (text) {
          if (currentSection === 'detail') {
            result.detail += text + '\n';
          } else if (currentSection === 'metrics') {
            result.metrics += text + '\n';
          } else if (currentSection === 'timeline') {
            result.timeline += text + '\n';
          } else if (currentSection === 'priority') {
            result.priority = text;
          } else if (currentSection === 'dueDate') {
            result.dueDate = text;
          }
        }
      }
      // For task items, add them to action items
      else if (collectingItems && node.type.name === 'taskItem') {
        const text = node.textContent.trim();
        if (text) {
          if (currentSection === 'actionItems') {
            result.actionItems.push({
              text,
              completed: node.attrs.checked
            });
          }
        }
      }
      // For list items, they might be related files
      else if (collectingItems && node.type.name === 'listItem') {
        const text = node.textContent.trim();
        if (text && currentSection === 'relatedFiles') {
          result.relatedFiles.push({
            name: text,
            url: '#'
          });
        }
      }
    }
    
    return true;
  });
  
  // Trim trailing newlines
  result.detail = result.detail.trim();
  result.metrics = result.metrics.trim();
  result.timeline = result.timeline.trim();
  
  return result;
};

// Helper to update document with goal data
const updateDocumentWithGoal = (editor, goalData) => {
  if (!editor) return;
  
  console.log("Goal data updated:", goalData);
  
  // Different update strategies based on where the goal was found
  if (goalData.source && goalData.source.type === 'table') {
    // For table-based goals, we'll update the cells in the row
    try {
      const { doc, tr } = editor.state;
      let updated = false;
      
      // Find the table row containing this goal
      doc.descendants((node, pos) => {
        if (node.type.name === 'tableRow') {
          // Check if this row contains our goal title
          let hasGoalTitle = false;
          let titleCellIndex = -1;
          
          node.forEach((cell, cellIndex) => {
            if (cell.textContent.trim() === goalData.title) {
              hasGoalTitle = true;
              titleCellIndex = cellIndex;
            }
          });
          
          if (hasGoalTitle) {
            // We found the row, now update cells based on their positions
            node.forEach((cell, cellIndex) => {
              // Skip the title cell
              if (cellIndex === titleCellIndex) return;
              
              // Determine what data to put in which cell (adjust based on your table structure)
              let newContent = '';
              if (cellIndex === titleCellIndex + 1) {
                // The cell after title might be for priority
                newContent = goalData.priority;
              } else if (cellIndex === titleCellIndex + 2) {
                // The next cell might be for due date
                newContent = goalData.dueDate;
              } else if (cellIndex === titleCellIndex + 3) {
                // The next cell might be for details
                newContent = goalData.detail;
              }
              
              // If we have content to update
              if (newContent && newContent !== cell.textContent.trim()) {
                // Get position of the cell content
                const cellPos = pos + 1; // Add 1 to get inside the cell
                
                // Delete existing content
                tr.delete(cellPos, cellPos + cell.content.size);
                
                // Insert new content (if using a schema with paragraphs in cells)
                const schema = editor.schema;
                const paragraph = schema.nodes.paragraph.create(
                  null, 
                  schema.text(newContent)
                );
                tr.insert(cellPos, paragraph);
                
                updated = true;
              }
            });
          }
        }
        
        return !updated; // Stop traversing if updated
      });
      
      if (updated) {
        editor.view.dispatch(tr);
      }
    } catch (error) {
      console.error("Error updating table goal:", error);
    }
  } else if (goalData.source && goalData.source.type === 'heading') {
    // For heading-based goals, we need to find and update the sections
    try {
      const { doc, tr } = editor.state;
      let sectionsToUpdate = {
        'Priority': goalData.priority,
        'Due Date': goalData.dueDate,
        'Detail': goalData.detail,
        'Success Metrics': goalData.metrics,
        'Timeline': goalData.timeline
      };
      
      // Find the heading for this goal
      let inGoalSection = false;
      let currentSection = null;
      
      doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          const text = node.textContent.trim();
          
          // Found the goal title
          if (text === goalData.title) {
            inGoalSection = true;
            return true;
          }
          
          // If we're in the goal's section, look for subsections
          if (inGoalSection) {
            // Check if this heading is a subsection
            if (Object.keys(sectionsToUpdate).includes(text)) {
              currentSection = text;
              return true;
            } else if (node.attrs.level <= 2) {
              // Found another goal or major heading, stop looking
              inGoalSection = false;
              currentSection = null;
              return false;
            }
          }
        }
        
        // Update content in the current section
        if (inGoalSection && currentSection && node.type.name === 'paragraph') {
          const sectionContent = sectionsToUpdate[currentSection];
          if (sectionContent && sectionContent !== node.textContent.trim()) {
            // Delete existing content
            tr.delete(pos, pos + node.nodeSize);
            
            // Insert new content
            const schema = editor.schema;
            const paragraph = schema.nodes.paragraph.create(
              null, 
              schema.text(sectionContent)
            );
            tr.insert(pos, paragraph);
            
            // Mark this section as updated
            delete sectionsToUpdate[currentSection];
          }
        }
        
        return true;
      });
      
      editor.view.dispatch(tr);
    } catch (error) {
      console.error("Error updating heading goal:", error);
    }
  }
};

export default function GoalEnabledEditor({ content, onUpdate, pageId }) {
  const [isPeekOpen, setIsPeekOpen] = useState(false);
  const [activeGoal, setActiveGoal] = useState(null);
  const [editorInstance, setEditorInstance] = useState(null);
  
  // Store editor instance for parsing
  const handleEditorReady = (editor) => {
    setEditorInstance(editor);
  };
  
  // Handle opening a goal's details panel
  const handleOpenGoal = useCallback((goalData) => {
    if (editorInstance) {
      // Extract more detailed data from the document
      const enhancedGoalData = extractGoalDetails(editorInstance, goalData.title);
      
      // If we found enhanced data, use it, otherwise use the basic data
      setActiveGoal(enhancedGoalData || goalData);
    } else {
      setActiveGoal(goalData);
    }
    
    setIsPeekOpen(true);
  }, [editorInstance]);
  
  // Handle goal data updates
  const handleGoalUpdate = useCallback((updatedGoal) => {
    setActiveGoal(updatedGoal);
    
    // Update document if we have an editor instance
    if (editorInstance) {
      updateDocumentWithGoal(editorInstance, updatedGoal);
    }
  }, [editorInstance]);
  
  // Create the goal extension with our handler
  const goalExtension = createGoalExtension(handleOpenGoal);
  
  // Close the peek sidebar
  const handleClosePeek = () => {
    setIsPeekOpen(false);
  };
  
  return (
    <div className="relative">
      {/* The editor with the goal extension */}
      <Editor
        content={content}
        onUpdate={onUpdate}
        pageId={pageId}
        customExtensions={[goalExtension]}
        onEditorReady={handleEditorReady}
      />
      
      {/* Goal peek sidebar */}
      <GoalPeek
        isOpen={isPeekOpen}
        onClose={handleClosePeek}
        goalData={activeGoal}
        onUpdate={handleGoalUpdate}
      />
    </div>
  );
} 