import { useState, useCallback, useEffect, useRef } from 'react';
import Editor from './Editor';
import GoalPeek from '../GoalPeek';
import createGoalExtension from './GoalExtension';
import goalService from '../../services/GoalService';
import { useLocation } from 'react-router-dom';

// Helper to extract document sections - we'll keep this for initial loading
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
              // Fourth column might be status
              result.status = text || 'In Progress';
            } else if (cellIndex === 4) {
              // Fifth column might be details
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
        } else if (text === 'Status') {
          currentSection = 'status';
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
          } else if (currentSection === 'status') {
            result.status = text;
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

export default function GoalEnabledEditor({ content, onUpdate, pageId }) {
  const [isPeekOpen, setIsPeekOpen] = useState(false);
  const [activeGoal, setActiveGoal] = useState(null);
  const [editorInstance, setEditorInstance] = useState(null);
  const [goals, setGoals] = useState([]);
  const location = useLocation();
  
  // Add a ref to track if a goal open/close operation is in progress
  const isProcessingRef = useRef(false);
  
  // Track the currently open goal ID
  const currentGoalIdRef = useRef(null);
  
  // Emit goal state change event
  const emitGoalStateChange = useCallback((goalId, isOpen) => {
    if (!goalId) return;
    
    console.log(`Emitting goal state change: ${goalId} is ${isOpen ? 'open' : 'closed'}`);
    
    // Create and dispatch custom event
    const event = new CustomEvent('goal-state-changed', {
      detail: { goalId, isOpen },
      bubbles: true
    });
    
    document.dispatchEvent(event);
  }, []);
  
  // Effect to track peek state changes
  useEffect(() => {
    if (isPeekOpen && activeGoal) {
      // Goal is opened
      currentGoalIdRef.current = activeGoal.id;
      emitGoalStateChange(activeGoal.id, true);
    } else if (!isPeekOpen && currentGoalIdRef.current) {
      // Goal is closed
      emitGoalStateChange(currentGoalIdRef.current, false);
      currentGoalIdRef.current = null;
    }
  }, [isPeekOpen, activeGoal, emitGoalStateChange]);
  
  // Load goals for this page on mount
  useEffect(() => {
    if (pageId) {
      // Create async function to load goals
      const loadGoals = async () => {
        try {
          const pageGoals = await goalService.getGoals({ pageId });
          setGoals(pageGoals || []);
          
          // If there's a goal ID in the location state, open that goal automatically
          const openGoalId = location.state?.openGoalId;
          if (openGoalId) {
            const goalToOpen = pageGoals.find(goal => goal.id === openGoalId);
            if (goalToOpen) {
              setActiveGoal(goalToOpen);
              setIsPeekOpen(true);
            }
          }
        } catch (error) {
          console.error('Error loading goals:', error);
          setGoals([]);
        }
      };
      
      // Execute the async function
      loadGoals();
    }
  }, [pageId, location.state]);
  
  // Subscribe to goal updates
  useEffect(() => {
    // Subscribe to goal updates from the service
    const unsubscribe = goalService.subscribe((updatedGoal) => {
      // Only update if the goal belongs to this page
      if (updatedGoal.pageId === pageId) {
        // Update local goals list
        setGoals(prevGoals => {
          // Ensure prevGoals is an array
          const currentGoals = Array.isArray(prevGoals) ? prevGoals : [];
          const index = currentGoals.findIndex(g => g.id === updatedGoal.id);
          if (index >= 0) {
            // Update existing goal
            const newGoals = [...currentGoals];
            newGoals[index] = updatedGoal;
            return newGoals;
          } else {
            // Add new goal
            return [...currentGoals, updatedGoal];
          }
        });
        
        // If this is the active goal, update it
        if (activeGoal && activeGoal.id === updatedGoal.id) {
          setActiveGoal(updatedGoal);
        }
        
        // Update the document if we have an editor instance
        if (editorInstance) {
          goalService.updateDocumentGoal(updatedGoal, editorInstance);
        }
      }
    });
    
    // Cleanup subscription on unmount
    return unsubscribe;
  }, [pageId, activeGoal, editorInstance]);
  
  // Store editor instance for parsing
  const handleEditorReady = (editor) => {
    setEditorInstance(editor);
  };
  
  // Handle opening a goal's details panel
  const handleOpenGoal = useCallback((goalData, isCurrentlyOpen) => {
    console.log('handleOpenGoal called with:', goalData.id, goalData.title, 'Currently open:', isCurrentlyOpen);
    
    // Prevent multiple rapid calls
    if (isProcessingRef.current) {
      console.log('Ignoring request - already processing a goal operation');
      return;
    }
    
    // Set processing flag
    isProcessingRef.current = true;
    
    // Check if we're dealing with a newly created goal (from Add new goal cell)
    const isNewGoalRequest = goalData.id.startsWith('goal-new-');
    
    // If this is a new goal request, always open it as a new goal
    if (isNewGoalRequest) {
      console.log('New goal creation request detected');
      setIsPeekOpen(false); // First close any open peek
      setActiveGoal(null);  // Clear any existing goal data
      
      // Create fresh goal object with the current page ID
      const freshGoal = {
        ...goalData,
        pageId: pageId
      };
      
      // Short delay to ensure UI has reset before opening new goal
      setTimeout(() => {
        setActiveGoal(freshGoal);
        setIsPeekOpen(true);
        
        // Reset processing flag after the peek is open
        isProcessingRef.current = false;
      }, 50);
      return;
    }
    
    // For existing goals, use the original toggle logic
    // Check if we're dealing with the currently open goal
    const isSameGoal = isPeekOpen && activeGoal && activeGoal.id === goalData.id;
    
    // If the goal is currently open or we're told it's open, close it
    if (isSameGoal || isCurrentlyOpen) {
      console.log('Closing peek (toggle behavior)');
      setIsPeekOpen(false);
      setActiveGoal(null);
      
      // Reset processing flag after delay
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
      return;
    }
    
    try {
      // Check if we already have this goal in our database
      const existingGoal = goalService.getGoalById(goalData.id);
      
      if (existingGoal) {
        console.log('Using existing goal from database');
        // Use the stored goal data
        setActiveGoal(existingGoal);
      } else if (editorInstance) {
        console.log('Extracting goal details from document');
        // Extract more detailed data from the document
        const enhancedGoalData = extractGoalDetails(editorInstance, goalData.title);
        
        // Add pageId to the goal data
        if (enhancedGoalData) {
          enhancedGoalData.pageId = pageId;
        }
        
        // If we found enhanced data, store it in our database
        if (enhancedGoalData) {
          const savedGoal = goalService.createGoal(enhancedGoalData);
          setActiveGoal(savedGoal);
        } else {
          // If we couldn't extract enhanced data, use the basic data
          goalData.pageId = pageId;
          const savedGoal = goalService.createGoal(goalData);
          setActiveGoal(savedGoal);
        }
      } else {
        console.log('Using basic goal data (no editor instance)');
        // If no editor instance, just use the basic data
        goalData.pageId = pageId;
        const savedGoal = goalService.createGoal(goalData);
        setActiveGoal(savedGoal);
      }
      
      // Always set to open at the end
      console.log('Opening peek');
      setIsPeekOpen(true);
    } catch (error) {
      console.error('Error opening goal:', error);
    }
    
    // Reset processing flag after delay
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 500);
  }, [editorInstance, pageId, isPeekOpen, activeGoal]);
  
  // Handle goal data updates
  const handleGoalUpdate = useCallback(async (updatedGoal) => {
    console.log('Goal update received:', updatedGoal.title, 'with new data:', updatedGoal);

    // Ensure the goal has the correct pageId
    if (!updatedGoal.pageId && pageId) {
      updatedGoal.pageId = pageId;
    }

    try {
      // Make sure we have a clean, serializable goal object
      const cleanGoal = { ...updatedGoal };
      
      // Check if this is a newly created goal (from the "Add new goal" row)
      const isNewGoal = cleanGoal.id.includes('goal-new-') && editorInstance;
      
      // Use the synchronize method from our service (wrapped in Promise to handle async)
      const result = await Promise.resolve(goalService.synchronizeGoal(cleanGoal, editorInstance));
      
      // If this was a new goal and we have an editor instance, update the table
      if (isNewGoal && editorInstance && result) {
        console.log('New goal created, updating table in document');
        goalService.updateGoalsTrackerTable(result, editorInstance);
      }
      
      // Update the local state only after successful synchronization
      if (result) {
        setActiveGoal(result);
        console.log('Goal successfully updated and synchronized', result.title);
      }
    } catch (error) {
      console.error('Error in handleGoalUpdate:', error);
      // Fallback to direct update without synchronization in case of error
      setActiveGoal(updatedGoal);
    }
  }, [editorInstance, pageId]);
  
  // Create the goal extension with our handler
  const goalExtension = createGoalExtension(handleOpenGoal);
  
  // Close the peek sidebar
  const handleClosePeek = useCallback(() => {
    console.log('handleClosePeek called, current state:', isPeekOpen);
    
    // Only process if not already closing
    if (!isProcessingRef.current && isPeekOpen) {
      isProcessingRef.current = true;
      
      // Save any pending changes to the active goal before closing
      if (activeGoal) {
        console.log('Saving goal data before closing peek:', activeGoal.id);
        // Make sure the goal is properly saved to both localStorage and API
        goalService.updateGoal(activeGoal.id, activeGoal)
          .then(() => {
            console.log('Goal successfully saved before closing');
          })
          .catch(error => {
            console.error('Error saving goal before closing:', error);
          });
        
        // Emit state change to update button appearance
        emitGoalStateChange(activeGoal.id, false);
      }
      
      // Close the peek
      setIsPeekOpen(false);
      
      // After animation completes, clear the active goal
      setTimeout(() => {
        setActiveGoal(null);
        isProcessingRef.current = false;
      }, 350); // Slightly longer than animation time
    }
  }, [isPeekOpen, activeGoal, emitGoalStateChange]);
  
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