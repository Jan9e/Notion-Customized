// GoalService.js - Service for handling goal data operations

import Goal from '../models/Goal';
import { api } from '../lib/api';

/**
 * Service for handling operations related to goals
 */
class GoalService {
  constructor() {
    this.goals = [];
    this.subscribers = [];
    this.storageKey = 'goals';
    this.useApi = true; // Flag to control whether to use API or localStorage
    
    // Load goals from localStorage initially for fast startup
    this.loadGoals();
  }
  
  /**
   * Load goals from localStorage
   * @returns {Array} Array of goals
   */
  loadGoals() {
    try {
      const goalsJson = localStorage.getItem(this.storageKey);
      this.goals = goalsJson ? JSON.parse(goalsJson) : [];
      console.log(`Loaded ${this.goals.length} goals from localStorage`);
      return this.goals;
    } catch (error) {
      console.error('Failed to load goals from localStorage:', error);
      this.goals = [];
      return [];
    }
  }
  
  /**
   * Save goals to localStorage (for offline and fallback)
   */
  saveGoals() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.goals));
    } catch (error) {
      console.error('Error saving goals to localStorage:', error);
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
   * Get all goals with optional filters
   * @param {Object} filters Optional filters (pageId, workspaceId)
   * @returns {Promise<Array>} Filtered array of goals
   */
  async getGoals(filters = {}) {
    console.log('getGoals called with filters:', filters);
    
    // Get fresh copy of all goals from localStorage first
    this.loadGoals();
    
    // Filter local goals first for faster UI response
    const localFilteredGoals = [...this.goals];
    let localPageGoals = [];
    
    // Apply filters to local goals
    if (filters.pageId) {
      console.log(`Filtering local goals for page ${filters.pageId}`);
      localPageGoals = localFilteredGoals.filter(goal => goal.pageId === filters.pageId);
      console.log(`Found ${localPageGoals.length} matching goals in localStorage for page ${filters.pageId}`);
    }
    
    if (this.useApi) {
      try {
        if (filters.pageId) {
          console.log(`Attempting to fetch goals for page ${filters.pageId} from API`);
          // Get goals from API
          const apiGoals = await api.getPageGoals(filters.pageId);
          
          // If we got goals from the API
          if (apiGoals && Array.isArray(apiGoals) && apiGoals.length > 0) {
            console.log(`Successfully retrieved ${apiGoals.length} goals from API`);
            
            // Convert to Goal objects
            const goalObjects = apiGoals.map(data => new Goal({
              ...data,
              pageId: filters.pageId
            }));
            
            // Update local cache
            this._updateLocalGoals(goalObjects);
            
            return goalObjects;
          } else if (localPageGoals.length > 0) {
            // If API returned no goals but we have local goals, use those and try to migrate them
            console.log(`API returned no goals, but found ${localPageGoals.length} local goals for this page. Attempting to migrate.`);
            
            // Try to migrate local goals to API
            this._migrateLocalGoalsToApi(localPageGoals);
            
            return localPageGoals;
          } else {
            // API returned empty, and we have no local goals
            console.log('No goals found in API or localStorage for this page');
            return [];
          }
        }
      } catch (error) {
        console.error('Error fetching goals from API, using local cache:', error);
        this.useApi = false; // Temporarily fall back to localStorage
        
        // Schedule retry of API connection after a delay
        setTimeout(() => {
          console.log('Resetting API connection after temporary failure');
          this.useApi = true;
        }, 60000); // Try again after 1 minute
        
        // Return local goals when API fails
        return filters.pageId ? localPageGoals : [];
      }
    }
    
    // Fall back to localStorage
    console.log('Using localStorage for goals due to API failure or preference');
    let filteredGoals = [...this.goals];
    
    // Apply filters
    if (filters.workspaceId) {
      filteredGoals = filteredGoals.filter(goal => goal.workspaceId === filters.workspaceId);
    }
    
    if (filters.pageId) {
      filteredGoals = filteredGoals.filter(goal => goal.pageId === filters.pageId);
    }
    
    console.log(`Returning ${filteredGoals.length} goals from localStorage`);
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
   * @returns {Promise<Goal>} Created goal
   */
  async createGoal(goalData) {
    console.log('Creating goal:', goalData);
    
    // Check if a goal with the same title already exists in this page
    const existingGoal = goalData.pageId && goalData.title ? 
      this.getGoalByTitle(goalData.title, goalData.pageId) : null;
    
    if (existingGoal) {
      // Update the existing goal instead of creating a new one
      console.log(`Goal with title "${goalData.title}" already exists, updating instead`);
      return this.updateGoal(existingGoal.id, {
        ...goalData,
        id: existingGoal.id // Preserve the original ID
      });
    }
    
    // Create a new goal object
    const goal = new Goal(goalData);
    
    // Calculate percent complete if it has action items
    if (goal.actionItems && goal.actionItems.length > 0) {
      goal.updatePercentComplete();
    }
    
    // If we have a pageId and API access, create in database
    if (this.useApi && goal.pageId) {
      try {
        console.log(`Creating goal in database for page ${goal.pageId}`);
        const createdGoal = await api.createPageGoal(goal.pageId, goal);
        
        // Update with server-assigned ID and timestamps
        const serverGoal = new Goal({
          ...goal,
          ...createdGoal
        });
        
        // Add to local cache
        this.goals.push(serverGoal);
        this.saveGoals();
        
        // Notify subscribers
        this.notifySubscribers(serverGoal);
        
        return serverGoal;
      } catch (error) {
        console.error('Failed to create goal in database:', error);
        this.useApi = false;
        
        // Schedule retry of API connection
        setTimeout(() => {
          this.useApi = true;
        }, 60000);
      }
    }
    
    // Fall back to localStorage
    this.goals.push(goal);
    this.saveGoals();
    
    // Notify subscribers
    this.notifySubscribers(goal);
    
    return goal;
  }
  
  /**
   * Update a goal by ID
   * @param {string} id Goal ID
   * @param {Object} changes Changes to apply
   * @returns {Promise<Goal|null>} Updated goal or null if not found
   */
  async updateGoal(id, changes) {
    console.log(`GoalService: Updating goal ${id}`, changes);
    
    // Find the goal in our local cache
    const goalIndex = this.goals.findIndex(goal => goal.id === id);
    if (goalIndex === -1) {
      console.warn(`Goal with ID ${id} not found for update`);
      return null;
    }

    // Get the current goal and apply updates
    const goal = this.goals[goalIndex];
    goal.update(changes);

    // Update percent complete if action items changed
    if (changes.actionItems) {
      goal.updatePercentComplete();
    }

    // Always update the goal in local cache first
    this.goals[goalIndex] = goal;
    
    // Save to localStorage for immediate persistence
    this.saveGoals();
    
    console.log(`Updated goal ${id} in localStorage`);

    // If we have API access and the goal has a pageId, update in database
    if (this.useApi && goal.pageId) {
      try {
        console.log(`Updating goal in database: ${id} for page ${goal.pageId}`);
        const updatedGoal = await api.updatePageGoal(goal.pageId, goal.id, goal);
        console.log(`Goal ${id} successfully updated in database`);
        
        // If the API returned updates, apply them to our local copy
        if (updatedGoal) {
          const freshGoal = new Goal({...goal, ...updatedGoal});
          this.goals[goalIndex] = freshGoal;
          this.saveGoals();
          
          // Notify subscribers
          this.notifySubscribers(freshGoal);
          
          return freshGoal;
        }
      } catch (error) {
        console.error(`Error updating goal ${id} in database:`, error);
        this.useApi = false;
        
        // If database update fails, we still have our local changes in localStorage
        // Schedule retry of API connection
        setTimeout(() => {
          this.useApi = true;
        }, 60000);
      }
    }
    
    // Notify subscribers of the update
    this.notifySubscribers(goal);
    
    // Return the locally updated goal
    return goal;
  }
  
  /**
   * Delete a goal
   * @param {string} id Goal ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async deleteGoal(id) {
    const goalToDelete = this.goals.find(goal => goal.id === id);
    if (!goalToDelete) return false;
    
    const initialLength = this.goals.length;
    this.goals = this.goals.filter(goal => goal.id !== id);
    
    if (this.goals.length !== initialLength) {
      // If we have API access and the goal has a pageId, delete from database
      if (this.useApi && goalToDelete.pageId) {
        try {
          console.log(`Deleting goal from database: ${id}`);
          await api.deletePageGoal(goalToDelete.pageId, id);
        } catch (error) {
          console.error('Failed to delete goal from database:', error);
          this.useApi = false;
          
          // Schedule retry of API connection
          setTimeout(() => {
            this.useApi = true;
          }, 60000);
        }
      }
      
      this.saveGoals();
      return true;
    }
    
    return false;
  }
  
  /**
   * Migrate local goals to the API
   * @param {Array} localGoals Array of goals to migrate
   * @private
   */
  async _migrateLocalGoalsToApi(localGoals) {
    if (!this.useApi || localGoals.length === 0) return;
    
    console.log(`Attempting to migrate ${localGoals.length} local goals to API`);
    
    for (const goal of localGoals) {
      try {
        if (!goal.pageId) {
          console.warn(`Goal ${goal.id} has no pageId, skipping migration`);
          continue;
        }
        
        // Create in API
        await api.createPageGoal(goal.pageId, goal);
        console.log(`Migrated goal "${goal.title}" to API`);
      } catch (error) {
        console.error(`Failed to migrate goal "${goal.title}" to API:`, error);
      }
    }
  }
  
  /**
   * Update local goals cache with new goals
   * @param {Array} goals Array of goals to add/update in local cache
   * @private
   */
  _updateLocalGoals(goals) {
    console.log(`Updating local goals cache with ${goals ? goals.length : 0} goals`);
    
    if (!goals || !Array.isArray(goals) || goals.length === 0) {
      console.warn('No valid goals to update in local cache');
      return;
    }
    
    // Remove existing goals with the same IDs
    const existingIds = goals.map(g => g.id);
    this.goals = this.goals.filter(goal => !existingIds.includes(goal.id));
    
    // Add the new/updated goals
    this.goals = [...this.goals, ...goals];
    
    // Update localStorage
    this.saveGoals();
    console.log(`Local goals cache now has ${this.goals.length} goals total`);
  }
  
  /**
   * Synchronize goal data between table and document
   * This ensures that changes in one representation are reflected in the other
   * @param {Goal} goal The goal to synchronize
   * @param {Object} editor The editor instance (optional)
   * @returns {Promise<Goal>} The synchronized goal
   */
  async synchronizeGoal(goal, editor = null) {
    if (!goal) return null;
    
    try {
      console.log(`Synchronizing goal: ${goal.id}`);
      
      // Update the goal in storage - this is now awaited
      const updatedGoal = await this.updateGoal(goal.id, goal);
      
      // If an editor is provided, update the document representation
      if (editor && updatedGoal) {
        this.updateDocumentGoal(updatedGoal, editor);
      }
      
      return updatedGoal;
    } catch (error) {
      console.error('Error synchronizing goal:', error);
      // If there's an error, we still want to return something
      return goal;
    }
  }
  
  /**
   * Update the document representation of a goal
   * @param {Goal} goal The goal to update in the document
   * @param {Object} editor The editor instance
   */
  updateDocumentGoal(goal, editor) {
    // Implementation depends on the editor's API
    // This method would update the table cells in the document
    // with the goal's current data
    console.log('Updating goal in document:', goal.title);
    
    // This would be implemented based on the specific editor component
    // being used and how it represents goals in the document
  }
}

// Create a singleton instance
const goalService = new GoalService();

export default goalService; 