import React from 'react';
import GoalIcon from './GoalIcon';

export default function GoalOpenButton({ onClick, isActive = false }) {
  return (
    <button
      className={`
        goal-open-button inline-flex items-center justify-center
        text-xs font-medium rounded 
        px-1.5 py-0.5 ml-2
        transition-colors duration-150
        ${isActive 
          ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
      `}
      onClick={(e) => {
        e.stopPropagation(); // Prevent triggering other click events
        onClick();
      }}
    >
      <GoalIcon size={12} />
      <span className="ml-1">Open</span>
    </button>
  );
} 