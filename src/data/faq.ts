export interface FAQEntry {
  question: string
  answer: string
}

export const FAQ_DATA: FAQEntry[] = [
  {
    question: 'Can I have multiple assignees on a task?',
    answer: 'Yes! Each task supports Primary and Secondary assignees. The Primary assignee is the main owner, while Secondary assignees provide support. Click the + button in the Assignees section of any task to add team members.',
  },
  {
    question: 'How do I export my data?',
    answer: 'Go to any project page and click the Export button in the toolbar. You can export tasks as CSV or JSON. Filters are applied to the export, so you can export a subset of tasks.',
  },
  {
    question: 'What are task types?',
    answer: 'Task types help categorize your work: Ad-Hoc for one-off items, Project for planned work, Recurring for repeating tasks, System for maintenance items, and Subtask for breaking down larger tasks.',
  },
  {
    question: 'How do task dependencies work?',
    answer: 'Dependencies let you mark that a task is blocked by another task. The blocked task cannot be completed until its dependency is done. Open a task and use the Dependencies section to add blockers. Circular dependencies are automatically prevented.',
  },
  {
    question: 'What are the different task views?',
    answer: 'There are four views: List (default table view), Board (Kanban-style columns by status), Calendar (tasks on a monthly calendar by due date), and Gantt (timeline view showing task durations and dependencies).',
  },
  {
    question: 'How do I set up recurring tasks?',
    answer: 'When creating or editing a task, use the Recurrence section to set a repeat pattern. Choose daily, weekly, or monthly frequency, set an interval, and optionally pick specific days of the week or an end date.',
  },
  {
    question: 'How do sub-teams work?',
    answer: 'Sub-teams let you organize members into smaller groups within your team. Admins can create sub-teams from the Admin Panel. Sub-teams help with filtering and organizing work across departments or squads.',
  },
  {
    question: 'Can I use keyboard shortcuts?',
    answer: 'Yes! Press Ctrl+K (or Cmd+K on Mac) to open the command palette, or press ? to see all available keyboard shortcuts. Shortcuts include quick task creation (N), search (Ctrl+K), and navigation.',
  },
  {
    question: 'How do I move tasks between projects?',
    answer: 'Open the task detail panel and change the Project field using the dropdown. The task will be moved to the selected project while keeping all its data, comments, and assignees.',
  },
  {
    question: 'What happens to trashed tasks?',
    answer: 'Trashed tasks are moved to the Trash page where they can be restored or permanently deleted. Tasks in trash for more than 30 days are automatically purged.',
  },
  {
    question: 'How do I tag or label tasks?',
    answer: 'Use the Tags field on any task to add labels. Start typing to see existing team tags or create new ones. Tags are shared across your team and can be used to filter tasks.',
  },
  {
    question: 'How do @mentions work in comments?',
    answer: 'Type @ in a comment to see a list of team members. Select a name to mention them. Mentioned members receive a notification about the comment.',
  },
]
