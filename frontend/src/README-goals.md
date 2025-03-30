# Goal Details Peek Feature

This feature implements a Notion-like "Open" button that appears next to goal headings and displays a right-side peek panel with goal details.

## Components

1. **GoalPeek.jsx**: The sidebar panel that displays goal details including:
   - Detail section
   - Success Metrics
   - Timeline
   - Action Plan (as a checklist)
   - Related files (as links)

2. **GoalOpenButton.jsx**: A small button with "Open" text and a target icon that appears next to goal headings.

3. **GoalIcon.jsx**: A SVG icon component for the goal target.

4. **GoalExtension.jsx**: A TipTap extension that adds the "Open" button next to headings in the document.

5. **GoalEnabledEditor.jsx**: A wrapper around the Editor component that adds the goal peek functionality.

## Implementation Details

- The peek panel appears on the right side of the screen when a goal's "Open" button is clicked.
- The panel extracts content from the document based on headings like "Detail", "Success Metrics", etc.
- The panel can be closed by clicking the X button, pressing Escape, or clicking outside the panel.
- The feature supports action items as checkboxes and related files as links.

## How to Use

### Basic Usage

Replace the regular Editor component with the GoalEnabledEditor:

```jsx
import GoalEnabledEditor from '../components/Editor/GoalEnabledEditor';

// In your render function
<GoalEnabledEditor
  content={page.content}
  onUpdate={handleContentChange}
  pageId={pageId}
/>
```

### Document Structure for Goal Details

For best results, structure your document with the following headings:

```
# Goal Name
(Your goal description)

## Detail
(Your goal details)

## Success Metrics
(Metrics to measure success)

## Timeline
(Deadlines and milestones)

## Action Plan
- [ ] Task 1
- [ ] Task 2
- [x] Completed Task

## Related files
- File 1
- File 2
```

## Demo

A demo implementation is available at `/goal-demo` route. This shows sample goals and how the peek panel works in practice.

## Styling

The feature uses Tailwind CSS for styling, consistent with the rest of the application. The animations for the panel are defined in `index.css`.

## Future Enhancements

Possible future enhancements include:
- Editing goal details directly in the peek panel
- Saving goal details to a separate data structure
- Adding progress tracking
- Implementing goal templates 