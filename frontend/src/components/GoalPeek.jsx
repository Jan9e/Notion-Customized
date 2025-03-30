import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, ChevronRight, Calendar, CheckCircle } from 'lucide-react';

export default function GoalPeek({ isOpen, onClose, goalData, onUpdate = () => {} }) {
  const peekRef = useRef(null);
  
  // Local state for editable fields
  const [goal, setGoal] = useState({
    title: 'Goal Name',
    detail: '',
    metrics: '',
    timeline: '',
    priority: 'Medium',
    dueDate: '',
    actionItems: [],
    relatedFiles: []
  });
  
  // Priority options
  const priorityOptions = [
    { value: 'High', color: '#C41E3A', bgColor: '#FFE2E2', borderColor: '#FFABAB' },
    { value: 'Medium', color: '#D97706', bgColor: '#FFF4E2', borderColor: '#FFD599' },
    { value: 'Low', color: '#059669', bgColor: '#ECFDF5', borderColor: '#A7F3D0' },
    { value: 'Critical', color: '#9D174D', bgColor: '#FDF2F8', borderColor: '#FBCFE8' },
    { value: 'Not Set', color: '#6B7280', bgColor: '#F3F4F6', borderColor: '#D1D5DB' }
  ];
  
  // Update local state when goalData changes
  useEffect(() => {
    if (goalData) {
      setGoal({
        ...goal,
        ...goalData
      });
    }
  }, [goalData]);
  
  // Close on escape key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);
  
  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (peekRef.current && !peekRef.current.contains(e.target) && !e.target.closest('.goal-open-button')) {
        onClose();
      }
    };
    
    if (isOpen) {
      // Small delay to prevent immediate close when clicking the open button
      setTimeout(() => {
        window.addEventListener('mousedown', handleOutsideClick);
      }, 10);
    }
    
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);
  
  // Handle field changes
  const handleFieldChange = (field, value) => {
    const updatedGoal = {
      ...goal,
      [field]: value
    };
    
    setGoal(updatedGoal);
    onUpdate(updatedGoal);
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
    onUpdate(updatedGoal);
  };
  
  // Add a new action item
  const addActionItem = () => {
    const updatedGoal = {
      ...goal,
      actionItems: [...goal.actionItems, { text: '', completed: false }]
    };
    
    setGoal(updatedGoal);
    onUpdate(updatedGoal);
  };
  
  // Priority color styling
  const getPriorityStyle = (priorityValue) => {
    const option = priorityOptions.find(opt => opt.value === priorityValue) || priorityOptions[4]; // Default to Not Set
    
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
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-xl z-50 overflow-hidden flex flex-col"
      ref={peekRef}
      style={{
        animation: 'slideInFromRight 0.2s ease-out forwards'
      }}
    >
      {/* Header with close button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <input
          type="text"
          value={goal.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          className="text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 w-full"
          placeholder="Goal Name"
        />
        <button 
          onClick={onClose}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close peek"
        >
          <X size={18} />
        </button>
      </div>
      
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Priority & Due Date row */}
        <div className="flex gap-4">
          {/* Priority dropdown */}
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Priority</label>
            <select
              value={goal.priority}
              onChange={(e) => handleFieldChange('priority', e.target.value)}
              className="w-full rounded border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={getPriorityStyle(goal.priority)}
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.value}
                </option>
              ))}
            </select>
          </div>
          
          {/* Due date picker */}
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Due Date</label>
            <div className="relative">
              <input
                type="date"
                value={goal.dueDate}
                onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                className="w-full rounded border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Calendar size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
        
        {/* Detail section */}
        <section>
          <h3 className="text-base font-bold mb-2 text-gray-900">Detail</h3>
          <textarea
            value={goal.detail}
            onChange={(e) => handleFieldChange('detail', e.target.value)}
            className="w-full bg-gray-50 p-3 rounded border border-gray-200 min-h-[100px] hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Write a clear, specific description of what you want to achieve"
          />
        </section>
        
        {/* Success Metrics section */}
        <section>
          <h3 className="text-base font-bold mb-2 text-gray-900">Success Metrics</h3>
          <textarea
            value={goal.metrics}
            onChange={(e) => handleFieldChange('metrics', e.target.value)}
            className="w-full bg-gray-50 p-3 rounded border border-gray-200 min-h-[80px] hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Define how you will measure progress and success"
          />
        </section>
        
        {/* Timeline section */}
        <section>
          <h3 className="text-base font-bold mb-2 text-gray-900">Timeline</h3>
          <textarea
            value={goal.timeline}
            onChange={(e) => handleFieldChange('timeline', e.target.value)}
            className="w-full bg-gray-50 p-3 rounded border border-gray-200 min-h-[80px] hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Set deadlines and milestones"
          />
        </section>
        
        {/* Action Plan section */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-gray-900">Action Plan</h3>
            <button 
              onClick={addActionItem}
              className="text-xs bg-blue-50 text-blue-600 rounded px-2 py-1 hover:bg-blue-100 transition-colors"
            >
              + Add Item
            </button>
          </div>
          
          <div className="bg-gray-50 p-3 rounded border border-gray-200 min-h-[100px] hover:bg-gray-100 transition-colors">
            {goal.actionItems && goal.actionItems.length > 0 ? (
              <ul className="space-y-2">
                {goal.actionItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <input 
                      type="checkbox" 
                      checked={item.completed} 
                      onChange={(e) => handleActionItemChange(index, { completed: e.target.checked })}
                      className="mt-1 rounded text-blue-600"
                    />
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => handleActionItemChange(index, { text: e.target.value })}
                      className={`flex-1 bg-transparent border-none p-0 focus:outline-none focus:ring-0 ${item.completed ? 'line-through text-gray-400' : ''}`}
                      placeholder="Add action item"
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col gap-2">
                <button 
                  onClick={addActionItem}
                  className="w-full text-center text-gray-400 hover:text-gray-600 py-2 border border-dashed border-gray-300 rounded"
                >
                  Click to add action items
                </button>
              </div>
            )}
          </div>
        </section>
        
        {/* Related files section */}
        <section>
          <h3 className="text-base font-bold mb-2 text-gray-900">Related files</h3>
          <div className="bg-gray-50 p-3 rounded border border-gray-200 min-h-[60px] hover:bg-gray-100 transition-colors">
            {goal.relatedFiles && goal.relatedFiles.length > 0 ? (
              <ul className="space-y-1">
                {goal.relatedFiles.map((file, index) => (
                  <li key={index}>
                    <a href={file.url} className="text-blue-600 hover:underline flex items-center">
                      <span>{file.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">Add links to related files or pages</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
} 