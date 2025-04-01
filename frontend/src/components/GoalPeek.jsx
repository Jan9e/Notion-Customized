import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, ChevronRight, Calendar, CheckCircle, Target, Clock, BarChart2, Save } from 'lucide-react';
import Goal from '../models/Goal';

export default function GoalPeek({ isOpen, onClose, goalData, onUpdate = () => {} }) {
  const peekRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const animationTimerRef = useRef(null);
  
  // Local state for editable fields
  const [goal, setGoal] = useState({
    title: 'Goal Name',
    detail: '',
    metrics: '',
    timeline: '',
    priority: Goal.PRIORITIES.MEDIUM,
    dueDate: '',
    status: Goal.STATUSES.IN_PROGRESS,
    actionItems: [],
    relatedFiles: []
  });
  
  // State for save indicator
  const [saveState, setSaveState] = useState('idle'); // 'idle', 'saving', 'saved'
  
  // Priority options using the consistent values from the Goal model
  const priorityOptions = [
    { value: Goal.PRIORITIES.HIGH, color: '#C41E3A', bgColor: '#FFE2E2', borderColor: '#FFABAB' },
    { value: Goal.PRIORITIES.MEDIUM, color: '#D97706', bgColor: '#FFF4E2', borderColor: '#FFD599' },
    { value: Goal.PRIORITIES.LOW, color: '#059669', bgColor: '#ECFDF5', borderColor: '#A7F3D0' },
    { value: Goal.PRIORITIES.CRITICAL, color: '#9D174D', bgColor: '#FDF2F8', borderColor: '#FBCFE8' },
    { value: Goal.PRIORITIES.NOT_SET, color: '#6B7280', bgColor: '#F3F4F6', borderColor: '#D1D5DB' }
  ];
  
  // Status options using the consistent values from the Goal model
  const statusOptions = [
    { value: Goal.STATUSES.NOT_STARTED, color: '#6B7280', bgColor: '#F3F4F6', borderColor: '#D1D5DB' },
    { value: Goal.STATUSES.IN_PROGRESS, color: '#3B82F6', bgColor: '#EFF6FF', borderColor: '#BFDBFE' },
    { value: Goal.STATUSES.COMPLETED, color: '#059669', bgColor: '#ECFDF5', borderColor: '#A7F3D0' },
    { value: Goal.STATUSES.BLOCKED, color: '#C41E3A', bgColor: '#FFE2E2', borderColor: '#FFABAB' }
  ];
  
  // State for animation
  const [animationState, setAnimationState] = useState('closed');
  
  // Prevent duplicate animations
  const isAnimatingRef = useRef(false);
  
  // Update local state when goalData changes
  useEffect(() => {
    if (goalData) {
      // Ensure date is properly formatted for the input
      let formattedGoalData = { ...goalData };
      
      // If dueDate exists but isn't in the YYYY-MM-DD format needed for input[type=date]
      if (formattedGoalData.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(formattedGoalData.dueDate)) {
        try {
          const date = new Date(formattedGoalData.dueDate);
          if (!isNaN(date.getTime())) {
            // Format as YYYY-MM-DD for the date input
            formattedGoalData.dueDate = date.toISOString().split('T')[0];
          }
        } catch (err) {
          console.warn('Could not parse date:', formattedGoalData.dueDate);
        }
      }
      
      setGoal({
        ...goal,
        ...formattedGoalData
      });
    }
  }, [goalData]);
  
  // Completely redesigned animation system to ensure smooth transitions
  useEffect(() => {
    // If already animating, clear any pending animation
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    
    console.log(`Animation control: isOpen=${isOpen}, current state=${animationState}`);
    
    // Only start an animation if we're not already in that state
    if (isOpen && animationState !== 'open') {
      // If we're currently mid-close, finish that first (ensures CSS classes are correct)
      if (animationState === 'closing') {
        // Force to closed state first (important for CSS)
        setAnimationState('closed');
        
        // Use a tiny delay to ensure the browser processes the closed state first
        setTimeout(() => {
          console.log('Starting delayed open animation');
          setAnimationState('opening');
          
          animationTimerRef.current = setTimeout(() => {
            console.log('Animation complete - now open');
            setAnimationState('open');
            animationTimerRef.current = null;
          }, 300);
        }, 20);
      } else {
        // Normal opening case
        console.log('Starting open animation');
        setAnimationState('opening');
        
        animationTimerRef.current = setTimeout(() => {
          console.log('Animation complete - now open');
          setAnimationState('open');
          animationTimerRef.current = null;
        }, 300);
      }
    } else if (!isOpen && animationState !== 'closed') {
      // Same pattern for closing
      if (animationState === 'opening') {
        // Force to open state first (important for CSS)
        setAnimationState('open');
        
        // Use a tiny delay to ensure the browser processes the open state first
        setTimeout(() => {
          console.log('Starting delayed close animation');
          setAnimationState('closing');
          
          animationTimerRef.current = setTimeout(() => {
            console.log('Animation complete - now closed');
            setAnimationState('closed');
            animationTimerRef.current = null;
          }, 300);
        }, 20);
      } else {
        // Normal closing case
        console.log('Starting close animation');
        setAnimationState('closing');
        
        animationTimerRef.current = setTimeout(() => {
          console.log('Animation complete - now closed');
          setAnimationState('closed');
          animationTimerRef.current = null;
        }, 300);
      }
    }
    
    // Cleanup function
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    };
  }, [isOpen, animationState]);
  
  // Cleanup saveTimeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  // Reset save indicator after showing "Saved"
  useEffect(() => {
    if (saveState === 'saved') {
      const timer = setTimeout(() => {
        setSaveState('idle');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [saveState]);
  
  // Close on escape key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        console.log('Closing peek via ESC key');
        onClose();
      }
    };
    
    // Use document level to ensure reliable capture
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);
  
  // Close when clicking outside
  useEffect(() => {
    // More robust outside click handler
    const handleOutsideClick = (e) => {
      // Check if peek exists and is open
      if (!peekRef.current || !isOpen) return;
      
      // Check if the click is on a goal button (which will handle toggling itself)
      const isGoalButtonClick = e.target.closest('.goal-open-button');
      
      // Only close if:
      // 1. The click is outside the panel
      // 2. The click is not on a goal button (which handles toggling itself)
      if (!peekRef.current.contains(e.target) && !isGoalButtonClick) {
        console.log('Closing peek via outside click');
        onClose();
      }
    };
    
    // Add click listener to document
    document.addEventListener('mousedown', handleOutsideClick, { capture: true });
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick, { capture: true });
    };
  }, [isOpen, onClose]);
  
  // Debounced update function
  const debouncedUpdate = (updatedGoal) => {
    setSaveState('saving');
    
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set a new timeout for the actual update
    saveTimeoutRef.current = setTimeout(() => {
      onUpdate(updatedGoal);
      setSaveState('saved');
    }, 500); // 500ms debounce
  };
  
  // Handle field changes with debounce for text fields
  const handleFieldChange = (field, value) => {
    const updatedGoal = {
      ...goal,
      [field]: value
    };
    
    setGoal(updatedGoal);
    
    // Use debounced update for text fields
    if (['title', 'detail', 'metrics', 'timeline'].includes(field)) {
      debouncedUpdate(updatedGoal);
    } else {
      // Immediate update for select fields and date picker
      setSaveState('saving');
      onUpdate(updatedGoal);
      setSaveState('saved');
    }
  };
  
  // Handle action item changes
  const handleActionItemChange = (index, changes) => {
    const updatedItems = [...goal.actionItems];
    updatedItems[index] = { ...updatedItems[index], ...changes };
    
    const updatedGoal = {
      ...goal,
      actionItems: updatedItems
    };
    
    setGoal(updatedGoal);
    
    // Use debounced update for text changes, immediate for checkbox
    if ('text' in changes) {
      debouncedUpdate(updatedGoal);
    } else {
      setSaveState('saving');
      onUpdate(updatedGoal);
      setSaveState('saved');
    }
  };
  
  // Add a new action item
  const addActionItem = () => {
    const updatedGoal = {
      ...goal,
      actionItems: [...goal.actionItems, { text: '', completed: false }]
    };
    
    setGoal(updatedGoal);
    setSaveState('saving');
    onUpdate(updatedGoal);
    setSaveState('saved');
  };
  
  // Priority color styling
  const getPriorityStyle = (priorityValue) => {
    const option = priorityOptions.find(opt => opt.value === priorityValue) || 
                  priorityOptions.find(opt => opt.value === Goal.PRIORITIES.NOT_SET);
    
    return {
      backgroundColor: option.bgColor,
      color: option.color,
      border: `1px solid ${option.borderColor}`
    };
  };
  
  // Status color styling
  const getStatusStyle = (statusValue) => {
    const option = statusOptions.find(opt => opt.value === statusValue) || 
                  statusOptions.find(opt => opt.value === Goal.STATUSES.IN_PROGRESS);
    
    return {
      backgroundColor: option.bgColor,
      color: option.color,
      border: `1px solid ${option.borderColor}`
    };
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
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
  
  // Render save indicator
  const renderSaveIndicator = () => {
    if (saveState === 'idle') return null;
    
    return (
      <div className={`absolute top-5 right-12 flex items-center gap-1.5 text-xs font-medium transition-all duration-300 ${saveState === 'saved' ? 'opacity-100' : 'opacity-80'}`}>
        {saveState === 'saving' ? (
          <div className="text-indigo-400 flex items-center bg-white/80 backdrop-blur-sm py-1 px-2 rounded-full shadow-sm">
            <div className="animate-spin h-3 w-3 border-2 border-indigo-200 border-t-indigo-500 rounded-full mr-1.5"></div>
            <span>Saving</span>
          </div>
        ) : (
          <div className="text-green-500 flex items-center bg-white/80 backdrop-blur-sm py-1 px-2 rounded-full shadow-sm">
            <Save size={12} className="mr-1" />
            <span>Saved</span>
          </div>
        )}
      </div>
    );
  };
  
  // Calculate progress based on action items
  const calculateProgress = () => {
    if (!goal.actionItems || goal.actionItems.length === 0) return 0;
    const completedItems = goal.actionItems.filter(item => item.completed).length;
    return Math.round((completedItems / goal.actionItems.length) * 100);
  };
  
  // More robust check to determine if component should render at all
  // Only hide when fully closed
  if (!isOpen && animationState === 'closed') return null;
  
  const progress = calculateProgress();
  
  // Determine animation and styles based on state
  const getAnimationStyles = () => {
    // No animation when component is in stable open/closed state
    if (animationState === 'open') {
      return {
        transform: 'translateX(0)',
        opacity: 1,
        transition: 'none' // No transition in stable state
      };
    } else if (animationState === 'closed') {
      return {
        transform: 'translateX(100%)',
        opacity: 0,
        transition: 'none' // No transition in stable state
      };
    }
    
    // Use CSS transitions instead of animations to prevent overlap
    return {
      transform: animationState === 'opening' ? 'translateX(0)' : 'translateX(100%)',
      opacity: animationState === 'opening' ? 1 : 0,
      transition: 'transform 300ms ease-out, opacity 300ms ease-out'
    };
  };
  
  return (
    <div 
      className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-xl z-50 overflow-hidden flex flex-col"
      ref={peekRef}
      style={{
        ...getAnimationStyles(),
        boxShadow: '0 0 25px rgba(0, 0, 0, 0.15)',
        borderLeft: '1px solid rgba(0, 0, 0, 0.08)'
      }}
    >
      {/* Progress indicator */}
      <div className="h-1 bg-gray-100 w-full">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Improved header with refined design */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100 relative bg-gradient-to-r from-white to-indigo-50">
        <div className="flex items-center flex-1">
          <div className="w-8 h-8 flex items-center justify-center mr-3 bg-indigo-100 text-indigo-600 rounded-lg shadow-sm">
            <Target size={18} />
          </div>
          <input
            type="text"
            value={goal.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            className="text-lg font-semibold text-gray-800 bg-transparent border-none focus:outline-none focus:ring-0 w-full"
            placeholder="Goal Name"
          />
        </div>
        {renderSaveIndicator()}
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Close button clicked');
            // Make sure the panel closes immediately
            setAnimationState('closing');
            onClose();
          }}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
          aria-label="Close peek"
        >
          <X size={18} />
        </button>
      </div>
      
      {/* Goal progress summary */}
      <div className="px-6 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-medium text-gray-700">Progress</div>
          <div className="text-sm font-medium text-indigo-600">{progress}%</div>
        </div>
        
        <div className="flex gap-4 items-center">
          {/* Progress bar */}
          <div className="h-2 bg-gray-100 rounded-full flex-1 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                progress >= 75 ? 'bg-green-500' : 
                progress >= 50 ? 'bg-indigo-500' : 
                progress >= 25 ? 'bg-yellow-500' : 
                'bg-red-400'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Status indicator */}
          <div 
            className="px-2.5 py-1 rounded-full text-xs font-medium"
            style={getStatusStyle(goal.status)}
          >
            {goal.status}
          </div>
        </div>
        
        {/* Summary info */}
        <div className="flex mt-2 text-xs text-gray-500">
          <div className="flex items-center mr-4">
            <CheckCircle size={12} className="mr-1" />
            <span>{goal.actionItems.filter(item => item.completed).length}/{goal.actionItems.length} tasks</span>
          </div>
          {goal.dueDate && (
            <div className="flex items-center">
              <Clock size={12} className="mr-1" />
              <span>Due {formatDate(goal.dueDate)}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Redesigned scrollable content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-7 bg-gray-50 bg-opacity-40">
        {/* Priority, Status & Due Date in a card */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-5">
          {/* Priority and Status in a row */}
          <div className="flex gap-4">
            {/* Priority dropdown with improved styling */}
            <div className="flex-1 min-w-[120px]">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <div className="w-5 h-5 mr-2 text-yellow-500">
                  <BarChart2 size={16} />
                </div>
                Priority
              </label>
              <select
                value={goal.priority}
                onChange={(e) => handleFieldChange('priority', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                style={getPriorityStyle(goal.priority)}
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.value}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Status dropdown with improved styling */}
            <div className="flex-1 min-w-[120px]">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <div className="w-5 h-5 mr-2 text-blue-500">
                  <CheckCircle size={16} />
                </div>
                Status
              </label>
              <select
                value={goal.status}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                style={getStatusStyle(goal.status)}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.value}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Due date picker in its own row */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <div className="w-5 h-5 mr-2 text-blue-500">
                <Clock size={16} />
              </div>
              Due Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={goal.dueDate}
                onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              />
              <Calendar size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            
            {/* Date display (for user-friendly format) */}
            {goal.dueDate && (
              <div className="flex items-center text-sm text-gray-500 mt-1.5 ml-7">
                <span>{formatDate(goal.dueDate)}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Detail section with card styling */}
        <section className="group bg-white rounded-xl p-5 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
          <h3 className="flex items-center text-sm font-medium text-gray-700 mb-3 group-hover:text-indigo-600 transition-colors">
            <div className="w-5 h-5 mr-2 text-indigo-500">
              <Target size={16} />
            </div>
            Detail
          </h3>
          <div className="rounded-lg overflow-hidden transition-all">
            <textarea
              value={goal.detail}
              onChange={(e) => handleFieldChange('detail', e.target.value)}
              className="w-full bg-gray-50 p-4 rounded-lg border border-transparent min-h-[120px] transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Write a clear, specific description of what you want to achieve"
            />
          </div>
        </section>
        
        {/* Success Metrics section with card styling */}
        <section className="group bg-white rounded-xl p-5 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
          <h3 className="flex items-center text-sm font-medium text-gray-700 mb-3 group-hover:text-indigo-600 transition-colors">
            <div className="w-5 h-5 mr-2 text-green-500">
              <BarChart2 size={16} />
            </div>
            Success Metrics
          </h3>
          <div className="rounded-lg overflow-hidden transition-all">
            <textarea
              value={goal.metrics}
              onChange={(e) => handleFieldChange('metrics', e.target.value)}
              className="w-full bg-gray-50 p-4 rounded-lg border border-transparent min-h-[100px] transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Define how you will measure progress and success"
            />
          </div>
        </section>
        
        {/* Timeline section with card styling */}
        <section className="group bg-white rounded-xl p-5 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
          <h3 className="flex items-center text-sm font-medium text-gray-700 mb-3 group-hover:text-indigo-600 transition-colors">
            <div className="w-5 h-5 mr-2 text-blue-500">
              <Calendar size={16} />
            </div>
            Timeline
          </h3>
          <div className="rounded-lg overflow-hidden transition-all">
            <textarea
              value={goal.timeline}
              onChange={(e) => handleFieldChange('timeline', e.target.value)}
              className="w-full bg-gray-50 p-4 rounded-lg border border-transparent min-h-[100px] transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Set deadlines and milestones"
            />
          </div>
        </section>
        
        {/* Action Plan section with card styling */}
        <section className="group bg-white rounded-xl p-5 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
              <div className="w-5 h-5 mr-2 text-indigo-500">
                <CheckCircle size={16} />
              </div>
              Action Plan
            </h3>
            <button 
              onClick={addActionItem}
              className="text-xs bg-indigo-50 text-indigo-600 rounded-lg px-3 py-1.5 hover:bg-indigo-100 transition-colors flex items-center shadow-sm"
            >
              <span className="mr-1">+</span> Add Item
            </button>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg min-h-[100px] transition-all">
            {goal.actionItems && goal.actionItems.length > 0 ? (
              <ul className="space-y-2.5">
                {goal.actionItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-3 group/item">
                    <div className="mt-1 flex-shrink-0">
                      <input 
                        type="checkbox" 
                        checked={item.completed} 
                        onChange={(e) => handleActionItemChange(index, { completed: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                    </div>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => handleActionItemChange(index, { text: e.target.value })}
                      className={`flex-1 bg-transparent border-none p-0 focus:outline-none focus:ring-0 ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'} transition-all`}
                      placeholder="Add action item"
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col gap-2">
                <button 
                  onClick={addActionItem}
                  className="w-full text-center text-gray-400 hover:text-indigo-600 py-4 border border-dashed border-gray-300 rounded-lg hover:border-indigo-300 transition-all"
                >
                  Click to add action items
                </button>
              </div>
            )}
          </div>
        </section>
        
        {/* Related files section with card styling */}
        <section className="group bg-white rounded-xl p-5 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
          <h3 className="flex items-center text-sm font-medium text-gray-700 mb-3 group-hover:text-indigo-600 transition-colors">
            <div className="w-5 h-5 mr-2 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            Related files
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg min-h-[60px] transition-all">
            {goal.relatedFiles && goal.relatedFiles.length > 0 ? (
              <ul className="space-y-2">
                {goal.relatedFiles.map((file, index) => (
                  <li key={index}>
                    <a href={file.url} className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center text-sm p-1.5 rounded hover:bg-indigo-50 transition-colors">
                      <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      <span>{file.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center h-full py-4">
                <p className="text-gray-400 text-sm">Add links to related files or pages</p>
              </div>
            )}
          </div>
        </section>
        
        {/* Footer padding for better scrolling experience */}
        <div className="h-6"></div>
      </div>
    </div>
  );
} 