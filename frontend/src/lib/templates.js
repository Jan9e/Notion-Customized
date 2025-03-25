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
    content: `<h1>Goals Tracker</h1>
<p></p>
<h2>Vision</h2>
<p>[Your long-term vision statement]</p>
<p></p>
<h2>Goals Overview</h2>
<table>
  <tr>
    <th>Goal</th>
    <th>Target Date</th>
    <th>Status</th>
  </tr>
  <tr>
    <td>[Goal 1]</td>
    <td>[Date]</td>
    <td>🟡 In Progress</td>
  </tr>
</table>
<p></p>
<h2>Key Milestones</h2>
<ul class="task-list">
  <li data-type="taskItem" data-checked="false">Milestone 1</li>
  <li data-type="taskItem" data-checked="false">Milestone 2</li>
  <li data-type="taskItem" data-checked="false">Milestone 3</li>
</ul>
<p></p>
<h2>Progress Tracking</h2>
<ul>
  <li>Current Status: [Status]</li>
  <li>Next Review: [Date]</li>
</ul>
<p></p>
<h2>Notes & Reflections</h2>
<p>[Add your reflections and learnings here]</p>`
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