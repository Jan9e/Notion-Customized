export const pageTemplates = [
  {
    id: 'blank',
    name: 'Blank page',
    description: 'Start from scratch with an empty page',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>',
    content: '<p></p>'
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Template for meeting agendas and notes',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    content: `<h1>Meeting Notes</h1>
<p></p>
<h2>Meeting Details</h2>
<ul>
  <li>Date: [Date]</li>
  <li>Time: [Time]</li>
  <li>Location: [Location/Link]</li>
  <li>Attendees: [Names]</li>
</ul>
<p></p>
<h2>Agenda</h2>
<ol>
  <li>[Topic 1]</li>
  <li>[Topic 2]</li>
  <li>[Topic 3]</li>
</ol>
<p></p>
<h2>Discussion Points</h2>
<ul class="task-list">
  <li data-type="taskItem" data-checked="false">[Point 1]</li>
  <li data-type="taskItem" data-checked="false">[Point 2]</li>
  <li data-type="taskItem" data-checked="false">[Point 3]</li>
</ul>
<p></p>
<h2>Action Items</h2>
<ul class="task-list">
  <li data-type="taskItem" data-checked="false">[Action 1] - Assigned to: [Name]</li>
  <li data-type="taskItem" data-checked="false">[Action 2] - Assigned to: [Name]</li>
</ul>
<p></p>
<h2>Next Steps</h2>
<ul>
  <li>Next meeting: [Date/Time]</li>
  <li>Follow-up items: [List]</li>
</ul>`
  },
  {
    id: 'goals-tracker',
    name: 'Goals Tracker',
    description: 'Track and manage your goals with clear milestones',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-target"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    content: `<h1 style="font-size: 2rem; font-weight: 600; margin-bottom: 16px;" data-no-goal-button="true">Goals Tracker</h1>
<p style="margin-top: 0; margin-bottom: 24px; color: #4b5563;" data-no-goal-button="true">Track your key objectives and goals.</p>

<div style="overflow-x: auto; width: 100%; padding-bottom: 20px;">
<table style="width: 100%; min-width: 800px; border-collapse: collapse; margin: 0; border: 1px solid #e9ecef; table-layout: fixed;">
  <colgroup>
    <col style="width: 40%;">
    <col style="width: 15%;">
    <col style="width: 15%;">
    <col style="width: 15%;">
    <col style="width: 15%;">
  </colgroup>
  <thead>
    <tr style="background-color: #f8f9fa;">
      <th style="padding: 12px 16px; text-align: left; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef;">Goal Name</th>
      <th style="padding: 12px 16px; text-align: left; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef;">Status</th>
      <th style="padding: 12px 16px; text-align: left; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef;">Due Date</th>
      <th style="padding: 12px 16px; text-align: left; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef;">Priority</th>
      <th style="padding: 12px 16px; text-align: left; border-bottom: 1px solid #e9ecef;">Team</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef;">
        <div style="font-weight: 500;">Increase sales by 30% across all major product lines and improve market penetration</div>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef;">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: #d3f9d8; color: #2b8a3e; font-size: 12px;">In Progress</span>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef;">Dec 31, 2023</td>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef;" class="priority-cell" data-priority="High">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: #ffe3e3; color: #c92a2a; font-size: 12px;" class="goals-tracker-priority">High</span>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef;">Marketing</td>
    </tr>
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef;">
        <div style="font-weight: 500;">Launch new product line with emphasis on sustainable materials and packaging</div>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef;">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: #d3f9d8; color: #2b8a3e; font-size: 12px;">In Progress</span>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef;">Nov 15, 2023</td>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef;" class="priority-cell" data-priority="Medium">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: #fff3bf; color: #e67700; font-size: 12px;" class="goals-tracker-priority">Medium</span>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef;">Product</td>
    </tr>
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef;">
        <div style="font-weight: 500;">Improve customer support response time from 24 hours to under 3 hours for all tickets</div>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef;">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: #e9ecef; color: #495057; font-size: 12px;">Completed</span>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef;">Oct 1, 2023</td>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef;" class="priority-cell" data-priority="Low">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: #e6fcf5; color: #0ca678; font-size: 12px;" class="goals-tracker-priority">Low</span>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef;">Support</td>
    </tr>
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef;">
        <div style="font-weight: 500;">Expand to international markets with focus on European and Asian regions</div>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef;">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: #ffdeeb; color: #c2255c; font-size: 12px;">Not Started</span>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef;">Feb 28, 2024</td>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef;" class="priority-cell" data-priority="Critical">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: #f3d9fa; color: #ae3ec9; font-size: 12px;" class="goals-tracker-priority">Critical</span>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef;">Business Development</td>
    </tr>
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef; color: #adb5bd; font-style: italic;">
        + Add new goal
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef;"></td>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef;"></td>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef; border-right: 1px solid #e9ecef;" class="priority-cell" data-priority="Not Set">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: #e9ecef; color: #495057; font-size: 12px;" class="goals-tracker-priority">Not Set</span>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e9ecef;"></td>
    </tr>
  </tbody>
</table>
</div>

<div style="font-size: 12px; color: #868e96; border-top: 1px solid #e9ecef; padding-top: 16px; margin-top: 20px;" data-no-goal-button="true">
  Last updated: June 2024 • Created with Notion Clone
</div>`
  },
  {
    id: 'project-plan',
    name: 'Project Plan',
    description: 'Comprehensive project planning template',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-git-branch"><line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>',
    content: `<h1>Project Plan</h1>
<p></p>
<h2>Project Overview</h2>
<ul>
  <li>Project Name: [Name]</li>
  <li>Start Date: [Date]</li>
  <li>End Date: [Date]</li>
  <li>Project Lead: [Name]</li>
</ul>
<p></p>
<h2>Objectives</h2>
<ol>
  <li>[Objective 1]</li>
  <li>[Objective 2]</li>
  <li>[Objective 3]</li>
</ol>
<p></p>
<h2>Team Members</h2>
<table>
  <tr>
    <th>Name</th>
    <th>Role</th>
    <th>Responsibilities</th>
  </tr>
  <tr>
    <td>[Name]</td>
    <td>[Role]</td>
    <td>[Responsibilities]</td>
  </tr>
</table>
<p></p>
<h2>Timeline</h2>
<ul class="task-list">
  <li data-type="taskItem" data-checked="false">Phase 1: [Description] - [Date]</li>
  <li data-type="taskItem" data-checked="false">Phase 2: [Description] - [Date]</li>
  <li data-type="taskItem" data-checked="false">Phase 3: [Description] - [Date]</li>
</ul>
<p></p>
<h2>Resources</h2>
<ul>
  <li>Budget: [Amount]</li>
  <li>Tools: [List]</li>
  <li>Dependencies: [List]</li>
</ul>
<p></p>
<h2>Risks & Mitigation</h2>
<table>
  <tr>
    <th>Risk</th>
    <th>Impact</th>
    <th>Mitigation Plan</th>
  </tr>
  <tr>
    <td>[Risk 1]</td>
    <td>[Impact]</td>
    <td>[Plan]</td>
  </tr>
</table>`
  }
]; 