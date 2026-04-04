export interface TroubleshootingEntry {
  problem: string
  solution: string
}

export const TROUBLESHOOTING_DATA: TroubleshootingEntry[] = [
  {
    problem: "Task doesn't save",
    solution: 'Check your internet connection and try again. If the problem persists, clear your browser cache (Ctrl+Shift+Delete), refresh the page, and retry. Ensure you have edit permissions for the project.',
  },
  {
    problem: "Can't see a task I know exists",
    solution: 'Check your active filters -- status, priority, type, and assignee filters may be hiding the task. Also verify you are viewing the correct project. If the task was deleted, check the Trash page.',
  },
  {
    problem: "Invite link doesn't work",
    solution: 'Invitation links expire after 7 days. Ask your team admin to send a new invite. Make sure you are signed in with the email address the invite was sent to.',
  },
  {
    problem: "Real-time updates aren't showing",
    solution: 'Real-time updates require a stable internet connection. Try refreshing the page. If updates still lag, check your browser\'s WebSocket support and ensure no firewall is blocking connections.',
  },
  {
    problem: "Can't create a project or task",
    solution: 'You need to be a member of a team first. Check that you have joined or created a team using the team switcher in the sidebar. Some actions may also require admin permissions.',
  },
  {
    problem: 'Chat messages not sending',
    solution: 'Verify your internet connection. If the message appears stuck, refresh the page and try again. Ensure you are a member of the conversation you are trying to send a message in.',
  },
  {
    problem: "Password reset email didn't arrive",
    solution: 'Check your spam/junk folder. The email comes from noreply@mail.app.supabase.io. If it still hasn\'t arrived after a few minutes, try requesting the reset again from the login page.',
  },
  {
    problem: 'Page loads but shows no data',
    solution: 'This usually means a network issue. Open your browser console (F12) and check for errors. Try signing out and back in. If the issue continues, check the Status page for any service disruptions.',
  },
]
