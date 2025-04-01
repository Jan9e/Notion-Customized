// Goal.js - Schema definition for goals

/**
 * Goal model represents a goal defined in the workspace
 * Goals can be associated with pages, sections, or tables
 */
class Goal {
  // Priority options for consistent display and reference
  static PRIORITIES = {
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
    NOT_SET: 'Not Set'
  };
  
  // Status options for consistent display and reference
  static STATUSES = {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    BLOCKED: 'Blocked'
  };
  
  constructor(data = {}) {
    this.id = data.id || `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.workspaceId = data.workspaceId || null;
    this.pageId = data.pageId || null;
    
    // Core goal data
    this.title = data.title || 'Untitled Goal';
    this.detail = data.detail || '';
    this.metrics = data.metrics || '';
    this.timeline = data.timeline || '';
    this.priority = this.validatePriority(data.priority) || Goal.PRIORITIES.MEDIUM;
    this.dueDate = data.dueDate || '';
    
    // Action items (tasks)
    this.actionItems = data.actionItems || [];
    
    // Related files
    this.relatedFiles = data.relatedFiles || [];
    
    // Source information (where the goal is defined in the document)
    this.source = data.source || {
      type: 'unknown', // 'heading', 'table', etc.
      position: null,   // position in the document
    };
    
    // Metadata
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.createdBy = data.createdBy || null;
    
    // Status tracking
    this.status = this.validateStatus(data.status) || Goal.STATUSES.IN_PROGRESS;
    this.percentComplete = data.percentComplete || 0;
  }
  
  // Validate priority to ensure it's one of our defined values
  validatePriority(priority) {
    if (!priority) return null;
    
    const priorities = Object.values(Goal.PRIORITIES);
    // Check for exact match
    if (priorities.includes(priority)) {
      return priority;
    }
    
    // Check for case-insensitive match
    const lowerPriority = priority.toLowerCase();
    for (const validPriority of priorities) {
      if (validPriority.toLowerCase() === lowerPriority) {
        return validPriority;
      }
    }
    
    return null;
  }
  
  // Validate status to ensure it's one of our defined values
  validateStatus(status) {
    if (!status) return null;
    
    const statuses = Object.values(Goal.STATUSES);
    // Check for exact match
    if (statuses.includes(status)) {
      return status;
    }
    
    // Check for case-insensitive match
    const lowerStatus = status.toLowerCase();
    for (const validStatus of statuses) {
      if (validStatus.toLowerCase() === lowerStatus) {
        return validStatus;
      }
    }
    
    return null;
  }
  
  // Helper to update goal data
  update(data) {
    // Handle priority consistently
    if (data.priority) {
      data.priority = this.validatePriority(data.priority) || data.priority;
    }
    
    // Handle status consistently
    if (data.status) {
      data.status = this.validateStatus(data.status) || data.status;
    }
    
    Object.keys(data).forEach(key => {
      if (this.hasOwnProperty(key)) {
        this[key] = data[key];
      }
    });
    
    this.updatedAt = new Date().toISOString();
    return this;
  }
  
  // Calculate percent complete based on action items
  calculatePercentComplete() {
    if (!this.actionItems || this.actionItems.length === 0) {
      return 0;
    }
    
    const completedItems = this.actionItems.filter(item => item.completed).length;
    return Math.round((completedItems / this.actionItems.length) * 100);
  }
  
  // Update percent complete
  updatePercentComplete() {
    this.percentComplete = this.calculatePercentComplete();
    return this;
  }
  
  // Format due date for display
  formatDueDate() {
    if (!this.dueDate) return '';
    
    try {
      const date = new Date(this.dueDate);
      if (isNaN(date.getTime())) return this.dueDate;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (err) {
      return this.dueDate;
    }
  }
}

export default Goal; 