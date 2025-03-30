import { useState } from 'react';
import GoalEnabledEditor from '../components/Editor/GoalEnabledEditor';
import DashboardNav from '../components/DashboardNav';

export default function GoalDemoPage() {
  const [content, setContent] = useState({
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Goal Demo Page' }]
      },
      {
        type: 'paragraph',
        content: [
          { 
            type: 'text', 
            text: 'This page demonstrates the goal peek functionality. Click the "Open" button next to any goal to view and edit its details.'
          }
        ]
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Goals in Headings' }]
      },
      {
        type: 'paragraph',
        content: [
          { 
            type: 'text', 
            text: 'Any level 1 or 2 heading can be treated as a goal. Try clicking the "Open" button next to the heading below:'
          }
        ]
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Launch New Website' }]
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Detail' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Complete the design and development of our new company website with improved UI/UX and performance.' }]
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Success Metrics' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '- Decrease bounce rate by 15%\n- Increase conversion rate by 10%\n- Improve page load speed by 30%' }]
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Timeline' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Q2 2023 - Complete design phase\nQ3 2023 - Complete development\nQ4 2023 - Launch and monitor' }]
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Priority' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'High' }]
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Due Date' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '2023-12-15' }]
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Action Plan' }]
      },
      {
        type: 'taskList',
        content: [
          {
            type: 'taskItem',
            attrs: { checked: true },
            content: [{ type: 'text', text: 'Gather requirements' }]
          },
          {
            type: 'taskItem',
            attrs: { checked: true },
            content: [{ type: 'text', text: 'Create wireframes' }]
          },
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [{ type: 'text', text: 'Design mockups' }]
          },
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [{ type: 'text', text: 'Develop frontend' }]
          },
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [{ type: 'text', text: 'Integrate backend' }]
          },
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [{ type: 'text', text: 'QA testing' }]
          },
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [{ type: 'text', text: 'Launch' }]
          }
        ]
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Goals in Tables' }]
      },
      {
        type: 'paragraph',
        content: [
          { 
            type: 'text', 
            text: 'Goals can also be represented in tables. Each row can represent a goal, and you can click the "Open" button next to the goal name to view and edit its details.'
          }
        ]
      },
      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableHeader',
                attrs: { colspan: 1, rowspan: 1, colwidth: [150] },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Goal' }] }]
              },
              {
                type: 'tableHeader',
                attrs: { colspan: 1, rowspan: 1, colwidth: [100] },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Priority' }] }]
              },
              {
                type: 'tableHeader',
                attrs: { colspan: 1, rowspan: 1, colwidth: [120] },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Due Date' }] }]
              },
              {
                type: 'tableHeader',
                attrs: { colspan: 1, rowspan: 1, colwidth: [300] },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Details' }] }]
              }
            ]
          },
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableCell',
                attrs: { colspan: 1, rowspan: 1, colwidth: [150] },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Improve SEO' }] }]
              },
              {
                type: 'tableCell',
                attrs: { colspan: 1, rowspan: 1, colwidth: [100] },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Medium' }] }]
              },
              {
                type: 'tableCell',
                attrs: { colspan: 1, rowspan: 1, colwidth: [120] },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: '2023-10-15' }] }]
              },
              {
                type: 'tableCell',
                attrs: { colspan: 1, rowspan: 1, colwidth: [300] },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Optimize website for search engines to increase organic traffic' }] }]
              }
            ]
          },
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableCell',
                attrs: { colspan: 1, rowspan: 1, colwidth: [150] },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Redesign Mobile App' }] }]
              },
              {
                type: 'tableCell',
                attrs: { colspan: 1, rowspan: 1, colwidth: [100] },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'High' }] }]
              },
              {
                type: 'tableCell',
                attrs: { colspan: 1, rowspan: 1, colwidth: [120] },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: '2023-11-30' }] }]
              },
              {
                type: 'tableCell',
                attrs: { colspan: 1, rowspan: 1, colwidth: [300] },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Create a new modern UI for our mobile app with improved user experience' }] }]
              }
            ]
          },
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableCell',
                attrs: { colspan: 1, rowspan: 1, colwidth: [150] },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Expand Product Line' }] }]
              },
              {
                type: 'tableCell',
                attrs: { colspan: 1, rowspan: 1, colwidth: [100] },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Critical' }] }]
              },
              {
                type: 'tableCell',
                attrs: { colspan: 1, rowspan: 1, colwidth: [120] },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: '2024-01-15' }] }]
              },
              {
                type: 'tableCell',
                attrs: { colspan: 1, rowspan: 1, colwidth: [300] },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Research and develop three new product categories to increase market share' }] }]
              }
            ]
          }
        ]
      }
    ]
  });

  const handleUpdate = (updatedContent) => {
    setContent(updatedContent);
  };

  return (
    <div className="flex h-screen bg-white">
      <DashboardNav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-800">Goal Demo</h1>
          <p className="text-sm text-gray-500">
            Click the "Open" button next to any goal title to see and edit its details
          </p>
        </header>
        <main className="flex-1 overflow-auto bg-white">
          <div className="w-full max-w-5xl mx-auto px-6 py-8">
            <GoalEnabledEditor 
              content={content} 
              onUpdate={handleUpdate} 
              pageId="goal-demo"
            />
          </div>
        </main>
      </div>
    </div>
  );
} 