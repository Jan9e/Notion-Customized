import { useState } from 'react';
import GoalPeek from './GoalPeek';
import GoalOpenButton from './GoalOpenButton';

// Sample goal data
const sampleGoals = [
  {
    id: 'goal1',
    title: 'Complete Project Documentation',
    detail: 'Create comprehensive documentation for the current project, including APIs, architecture, and user guides.',
    metrics: 'All APIs documented, architecture diagrams created, user guide finished and reviewed by the team.',
    timeline: 'Start: June 1, 2023\nDeadline: June 15, 2023',
    actionItems: [
      { text: 'Create outline for documentation', completed: true },
      { text: 'Document all API endpoints', completed: false },
      { text: 'Create architecture diagrams', completed: false },
      { text: 'Write user guides', completed: false },
      { text: 'Review with team', completed: false }
    ],
    relatedFiles: [
      { name: 'API Specifications', url: '#' },
      { name: 'Architecture Overview', url: '#' }
    ]
  },
  {
    id: 'goal2',
    title: 'Improve Application Performance',
    detail: 'Identify and resolve performance bottlenecks to improve overall application speed.',
    metrics: 'Page load time under 2 seconds, API response time under 300ms, Overall Lighthouse score > 90',
    timeline: 'Start: June 5, 2023\nDeadline: June 30, 2023',
    actionItems: [
      { text: 'Run performance audit', completed: true },
      { text: 'Identify top 3 bottlenecks', completed: true },
      { text: 'Optimize database queries', completed: false },
      { text: 'Implement caching strategy', completed: false },
      { text: 'Optimize frontend assets', completed: false },
      { text: 'Measure performance improvements', completed: false }
    ],
    relatedFiles: [
      { name: 'Performance Audit Results', url: '#' },
      { name: 'Optimization Plan', url: '#' }
    ]
  },
  {
    id: 'goal3',
    title: 'Launch Beta Testing Program',
    detail: 'Prepare and launch a beta testing program to gather user feedback before the final release.',
    metrics: 'At least 50 beta testers, 80% feature test coverage, 100+ pieces of feedback collected',
    timeline: 'Start: July 1, 2023\nDeadline: July 15, 2023',
    actionItems: [
      { text: 'Create beta testing plan', completed: false },
      { text: 'Prepare feedback collection system', completed: false },
      { text: 'Recruit beta testers', completed: false },
      { text: 'Launch beta version', completed: false },
      { text: 'Collect and analyze feedback', completed: false }
    ],
    relatedFiles: [
      { name: 'Beta Testing Plan', url: '#' },
      { name: 'Feedback Form Template', url: '#' }
    ]
  }
];

export default function GoalDemo() {
  const [activeGoalId, setActiveGoalId] = useState(null);
  const [isPeekOpen, setIsPeekOpen] = useState(false);
  
  // Get active goal data
  const activeGoal = sampleGoals.find(goal => goal.id === activeGoalId);
  
  // Handle opening a goal's details
  const handleOpenGoal = (goalId) => {
    setActiveGoalId(goalId);
    setIsPeekOpen(true);
  };
  
  // Handle closing the peek sidebar
  const handleClosePeek = () => {
    setIsPeekOpen(false);
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Project Goals</h1>
      
      {/* Goal list */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium">
          Goals
        </div>
        <div className="divide-y divide-gray-200">
          {sampleGoals.map(goal => (
            <div 
              key={goal.id} 
              className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-gray-800 font-medium">{goal.title}</span>
                <GoalOpenButton 
                  onClick={() => handleOpenGoal(goal.id)} 
                  isActive={activeGoalId === goal.id && isPeekOpen}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Goal peek sidebar */}
      <GoalPeek 
        isOpen={isPeekOpen} 
        onClose={handleClosePeek} 
        goalData={activeGoal}
      />
    </div>
  );
} 