import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import goalService from '../services/GoalService';
import { Calendar, Clock, CheckCircle, AlertTriangle, Target, Filter, Search, Plus } from 'lucide-react';

export default function GoalDashboard() {
  const [goals, setGoals] = useState([]);
  const [filteredGoals, setFilteredGoals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const navigate = useNavigate();
  
  // Load goals on mount
  useEffect(() => {
    const allGoals = goalService.getGoals();
    setGoals(allGoals);
    setFilteredGoals(allGoals);
  }, []);
  
  // Filter goals when filters change
  useEffect(() => {
    let result = goals;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(goal => 
        goal.title.toLowerCase().includes(query) || 
        goal.detail.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(goal => goal.status === filterStatus);
    }
    
    // Apply priority filter
    if (filterPriority !== 'all') {
      result = result.filter(goal => goal.priority === filterPriority);
    }
    
    setFilteredGoals(result);
  }, [searchQuery, filterStatus, filterPriority, goals]);
  
  // Get color for priority
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Medium':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Critical':
        return 'bg-pink-100 text-pink-800 border-pink-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  // Get color for status
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Not Started':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Blocked':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (err) {
      return dateString;
    }
  };
  
  // Navigate to page containing the goal
  const navigateToGoal = (goal) => {
    if (goal.pageId) {
      navigate(`/page/${goal.pageId}`, { state: { openGoalId: goal.id } });
    }
  };
  
  // Handle deleting a goal
  const handleDeleteGoal = (e, goalId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this goal?')) {
      goalService.deleteGoal(goalId);
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Goal Dashboard</h1>
        <p className="text-gray-600">Track and manage all your goals in one place</p>
      </header>
      
      {/* Search and filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search goals..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center">
          <Filter size={18} className="text-gray-500 mr-2" />
          <span className="text-sm font-medium text-gray-700 mr-2">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>
        
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700 mr-2">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="Not Set">Not Set</option>
          </select>
        </div>
      </div>
      
      {/* Goals list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredGoals.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredGoals.map(goal => (
              <div 
                key={goal.id} 
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigateToGoal(goal)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-indigo-100 text-indigo-600 rounded-md flex items-center justify-center mr-3">
                      <Target size={18} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                  </div>
                  
                  <div className="flex gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(goal.priority)}`}>
                      {goal.priority}
                    </span>
                    
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(goal.status)}`}>
                      {goal.status}
                    </span>
                  </div>
                </div>
                
                {goal.detail && (
                  <p className="text-sm text-gray-600 ml-11 mb-3 line-clamp-2">{goal.detail}</p>
                )}
                
                <div className="flex flex-wrap items-center gap-4 ml-11">
                  {goal.dueDate && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock size={14} className="mr-1" />
                      <span>{formatDate(goal.dueDate)}</span>
                    </div>
                  )}
                  
                  {goal.actionItems && goal.actionItems.length > 0 && (
                    <div className="flex items-center text-sm text-gray-500">
                      <CheckCircle size={14} className="mr-1" />
                      <span>
                        {goal.actionItems.filter(item => item.completed).length} / {goal.actionItems.length} tasks
                      </span>
                    </div>
                  )}
                  
                  <button
                    onClick={(e) => handleDeleteGoal(e, goal.id)}
                    className="ml-auto text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 text-gray-500 mb-3">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No goals found</h3>
            <p className="text-gray-500">
              {goals.length === 0 
                ? "You haven't created any goals yet." 
                : "No goals match your current filters."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 