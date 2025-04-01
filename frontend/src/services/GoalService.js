// GoalService.js - Service for handling goal data operations

import Goal from '../models/Goal';

/**
 * Service for handling operations related to goals
 */
class GoalService {
  constructor() {
    this.storageKey = 'notion_clone_goals';
    this.goals = this.loadGoals();
    this.subscribers = [];
  }
  
  /**
   * Load goals from storage
   * @returns {Array} Array of Goal objects
   */
  loadGoals() {
    try {
      const storedGoals = localStorage.getItem(this.storageKey);
      if (!storedGoals) return [];
      
      const parsedGoals = JSON.parse(storedGoals);
      return parsedGoals.map(data => new Goal(data));
    } catch (error) {
      console.error('Error loading goals:', error);
      return [];
    }
  }
  
  /**
   * Save goals to storage
   */
  saveGoals() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.goals));
    } catch (error) {
      console.error('Error saving goals:', error);
    }
  }
  
  /**
   * Subscribe to goal updates
   * @param {Function} callback Callback function to call when goals are updated
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Notify subscribers about goal updates
   * @param {Goal} updatedGoal The goal that was updated
   */
  notifySubscribers(updatedGoal) {
    this.subscribers.forEach(callback => {
      try {
        callback(updatedGoal);
      } catch (error) {
        console.error('Error in goal update subscriber:', error);
      }
    });
  }
  
  /**
   * Get all goals
   * @param {Object} filters Optional filters
   * @returns {Array} Filtered array of goals
   */
  getGoals(filters = {}) {
    let filteredGoals = [...this.goals];
    
    // Apply filters
    if (filters.workspaceId) {
      filteredGoals = filteredGoals.filter(goal => goal.workspaceId === filters.workspaceId);
    }
    
    if (filters.pageId) {
      filteredGoals = filteredGoals.filter(goal => goal.pageId === filters.pageId);
    }
    
    return filteredGoals;
  }
  
  /**
   * Get a goal by ID
   * @param {string} id Goal ID
   * @returns {Goal|null} Goal object or null if not found
   */
  getGoalById(id) {
    return this.goals.find(goal => goal.id === id) || null;
  }
  
  /**
   * Get a goal by title in a specific page
   * @param {string} title Goal title
   * @param {string} pageId Page ID
   * @returns {Goal|null} Goal object or null if not found
   */
  getGoalByTitle(title, pageId) {
    return this.goals.find(goal => 
      goal.title.toLowerCase() === title.toLowerCase() && 
      goal.pageId === pageId
    ) || null;
  }
  
  /**
   * Create a new goal
   * @param {Object} goalData Goal data
   * @returns {Goal} Created goal
   */
  createGoal(goalData) {
    // Check if a goal with the same title already exists in this page
    const existingGoal = goalData.pageId && goalData.title ? 
      this.getGoalByTitle(goalData.title, goalData.pageId) : null;
    
    if (existingGoal) {
      // Update the existing goal instead of creating a new one
      return this.updateGoal(existingGoal.id, {
        ...goalData,
        id: existingGoal.id // Preserve the original ID
      });
    }
    
    const goal = new Goal(goalData);
    
    // Calculate percent complete if it has action items
    if (goal.actionItems && goal.actionItems.length > 0) {
      goal.updatePercentComplete();
    }
    
    this.goals.push(goal);
    this.saveGoals();
    
    // Notify subscribers
    this.notifySubscribers(goal);
    
    return goal;
  }
  
  /**
   * Update a goal
   * @param {string} id Goal ID
   * @param {Object} changes Changes to apply
   * @returns {Goal|null} Updated goal or null if not found
   */
  updateGoal(id, changes) {
    const goalIndex = this.goals.findIndex(goal => goal.id === id);
    if (goalIndex === -1) return null;
    
    const goal = this.goals[goalIndex];
    goal.update(changes);
    
    // Update percent complete if action items changed
    if (changes.actionItems) {
      goal.updatePercentComplete();
    }
    
    this.goals[goalIndex] = goal;
    this.saveGoals();
    
    // Notify subscribers
    this.notifySubscribers(goal);
    
    return goal;
  }
  
  /**
   * Delete a goal
   * @param {string} id Goal ID
   * @returns {boolean} True if deleted, false if not found
   */
  deleteGoal(id) {
    const initialLength = this.goals.length;
    this.goals = this.goals.filter(goal => goal.id !== id);
    
    if (this.goals.length !== initialLength) {
      this.saveGoals();
      return true;
    }
    
    return false;
  }
  
  /**
   * Search goals by title or content
   * @param {string} query Search query
   * @returns {Array} Array of matching goals
   */
  searchGoals(query) {
    if (!query || typeof query !== 'string') return [];
    
    const lowerQuery = query.toLowerCase();
    return this.goals.filter(goal => {
      return (
        goal.title.toLowerCase().includes(lowerQuery) ||
        goal.detail.toLowerCase().includes(lowerQuery) ||
        goal.metrics.toLowerCase().includes(lowerQuery) ||
        goal.timeline.toLowerCase().includes(lowerQuery) ||
        goal.actionItems.some(item => item.text.toLowerCase().includes(lowerQuery))
      );
    });
  }
  
  /**
   * Synchronize goal data between table and document
   * This ensures that changes in one representation are reflected in the other
   * @param {Goal} goal The goal to synchronize
   * @param {Object} editor The editor instance (optional)
   */
  synchronizeGoal(goal, editor = null) {
    if (!goal) return;
    
    // Update the goal in storage
    this.updateGoal(goal.id, goal);
    
    // If an editor is provided, update the document representation
    if (editor) {
      this.updateDocumentGoal(goal, editor);
    }
    
    return goal;
  }
  
  /**
   * Update the document representation of a goal
   * @param {Goal} goal The goal to update in the document
   * @param {Object} editor The editor instance
   */
  updateDocumentGoal(goal, editor) {
    if (!goal || !editor) return;
    
    try {
      const { doc, tr } = editor.state;
      let updated = false;
      
      // Handle table-based goals
      if (goal.source && goal.source.type === 'table') {
        // Find the table row containing the goal title
        doc.descendants((node, pos) => {
          if (node.type.name === 'tableRow') {
            let hasTitleCell = false;
            let titleCellIndex = -1;
            
            // Check if this row contains our goal title
            node.forEach((cell, cellIndex) => {
              if (cell.textContent.trim() === goal.title) {
                hasTitleCell = true;
                titleCellIndex = cellIndex;
              }
            });
            
            if (hasTitleCell) {
              // Update cells in this row
              node.forEach((cell, cellIndex) => {
                // Skip the title cell
                if (cellIndex === titleCellIndex) return;
                
                // Map cell position to goal property
                let propertyValue = '';
                if (cellIndex === titleCellIndex + 1) {
                  propertyValue = goal.priority || '';
                } else if (cellIndex === titleCellIndex + 2) {
                  propertyValue = goal.formatDueDate() || '';
                } else if (cellIndex === titleCellIndex + 3) {
                  propertyValue = goal.status || '';
                } else if (cellIndex === titleCellIndex + 4) {
                  propertyValue = goal.detail || '';
                }
                
                // Only update if value has changed
                if (propertyValue && propertyValue !== cell.textContent.trim()) {
                  const cellPos = pos + 1; // Position inside the cell
                  
                  // Delete existing content
                  tr.delete(cellPos, cellPos + cell.content.size);
                  
                  // Insert new content
                  const schema = editor.schema;
                  const paragraph = schema.nodes.paragraph.create(
                    null,
                    schema.text(propertyValue)
                  );
                  tr.insert(cellPos, paragraph);
                  
                  updated = true;
                }
              });
            }
          }
          
          return !updated; // Stop if we already updated
        });
      }
      // Handle heading-based goals
      else if (goal.source && goal.source.type === 'heading') {
        // Find sections under the heading
        let inGoalSection = false;
        let currentSection = null;
        
        // Map of section names to goal properties
        const sectionMap = {
          'Detail': 'detail',
          'Priority': 'priority',
          'Due Date': 'dueDate',
          'Success Metrics': 'metrics',
          'Timeline': 'timeline',
          'Status': 'status'
        };
        
        doc.descendants((node, pos) => {
          if (node.type.name === 'heading') {
            const text = node.textContent.trim();
            
            // Found the goal title
            if (text === goal.title) {
              inGoalSection = true;
              return true;
            }
            
            // If we're in the goal section, look for subsections
            if (inGoalSection) {
              if (Object.keys(sectionMap).includes(text)) {
                currentSection = text;
                return true;
              } else if (node.attrs.level <= 2) {
                // Found another major heading, stop
                inGoalSection = false;
                currentSection = null;
                return false;
              }
            }
          }
          
          // Update content if we're in a known section
          if (inGoalSection && currentSection && node.type.name === 'paragraph') {
            const goalProperty = sectionMap[currentSection];
            let newValue = '';
            
            if (goalProperty === 'dueDate') {
              newValue = goal.formatDueDate();
            } else {
              newValue = goal[goalProperty] || '';
            }
            
            if (newValue && newValue !== node.textContent.trim()) {
              // Delete existing content
              tr.delete(pos, pos + node.nodeSize);
              
              // Insert new content
              const schema = editor.schema;
              const paragraph = schema.nodes.paragraph.create(
                null,
                schema.text(newValue)
              );
              tr.insert(pos, paragraph);
              
              updated = true;
            }
          }
          
          return true;
        });
      }
      
      if (updated) {
        editor.view.dispatch(tr);
      }
    } catch (error) {
      console.error('Error updating document goal:', error);
    }
  }
}

// Create a singleton instance
const goalService = new GoalService();

export default goalService; 