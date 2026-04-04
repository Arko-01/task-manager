import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTeamStore } from '../../store/teamStore'
import { useProjectStore } from '../../store/projectStore'
import { useAuthStore } from '../../store/authStore'
import { CheckCircle2, Users, FolderPlus, ListTodo, LogIn, UserPlus, LayoutGrid, Keyboard, X } from 'lucide-react'

export function WelcomeGuide() {
  const { currentTeam, members } = useTeamStore()
  const { projects } = useProjectStore()
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('onboarding-dismissed') === 'true')
  const [dismissedSteps, setDismissedSteps] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('onboarding-dismissed-steps')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })

  if (dismissed) return null

  const dismissStep = (stepId: string) => {
    const next = new Set(dismissedSteps)
    next.add(stepId)
    setDismissedSteps(next)
    localStorage.setItem('onboarding-dismissed-steps', JSON.stringify([...next]))
  }

  const hasTaskFlag = localStorage.getItem('onboarding-task-created') === 'true'
  const hasBoardFlag = localStorage.getItem('onboarding-board-viewed') === 'true'
  const hasShortcutsFlag = localStorage.getItem('onboarding-shortcuts-viewed') === 'true'

  const steps = [
    {
      id: 'signin',
      label: 'Sign in',
      done: !!profile,
      icon: LogIn,
      action: () => {},
    },
    {
      id: 'team',
      label: 'Join or create a team',
      done: !!currentTeam,
      icon: Users,
      action: () => {},
    },
    {
      id: 'invite',
      label: 'Invite a team member',
      done: members.length > 1,
      icon: UserPlus,
      action: () => {
        if (currentTeam) window.dispatchEvent(new CustomEvent('open-invite-modal'))
      },
    },
    {
      id: 'project',
      label: 'Create your first project',
      done: projects.length > 0,
      icon: FolderPlus,
      action: () => {
        if (currentTeam) window.dispatchEvent(new CustomEvent('open-create-project'))
      },
    },
    {
      id: 'task',
      label: 'Add your first task',
      done: hasTaskFlag,
      icon: ListTodo,
      action: () => {
        if (projects.length) navigate(`/projects/${projects[0].id}`)
      },
    },
    {
      id: 'board',
      label: 'Try the board view',
      done: hasBoardFlag,
      icon: LayoutGrid,
      action: () => {
        window.dispatchEvent(new CustomEvent('switch-view', { detail: 'board' }))
        localStorage.setItem('onboarding-board-viewed', 'true')
      },
    },
    {
      id: 'shortcuts',
      label: 'Explore keyboard shortcuts',
      done: hasShortcutsFlag,
      icon: Keyboard,
      action: () => {
        window.dispatchEvent(new CustomEvent('toggle-help'))
        localStorage.setItem('onboarding-shortcuts-viewed', 'true')
      },
    },
  ]

  const visibleSteps = steps.filter((s) => !dismissedSteps.has(s.id))
  const completedCount = steps.filter((s) => s.done).length
  const allDone = completedCount === steps.length

  if (allDone) {
    localStorage.setItem('onboarding-dismissed', 'true')
    return null
  }

  return (
    <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50/50 p-5 dark:border-primary-800 dark:bg-primary-900/20">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Welcome{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Step {completedCount} of {steps.length} completed
          </p>
        </div>
        <button
          onClick={() => { setDismissed(true); localStorage.setItem('onboarding-dismissed', 'true') }}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          Dismiss
        </button>
      </div>

      <div className="mt-3">
        <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-1.5 rounded-full bg-primary-500 transition-all"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-1">
        {visibleSteps.map((step) => (
          <div key={step.id} className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-primary-100/50 dark:hover:bg-primary-900/30">
            <button
              onClick={step.action}
              disabled={step.done}
              className="flex flex-1 items-center gap-3 text-left disabled:cursor-default"
            >
              {step.done ? (
                <CheckCircle2 size={20} className="text-green-500 shrink-0" />
              ) : (
                <step.icon size={20} className="text-primary-500 shrink-0" />
              )}
              <span className={`text-sm font-medium ${step.done ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                {step.label}
              </span>
            </button>
            {!step.done && (
              <button
                onClick={() => dismissStep(step.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 transition-opacity"
                title="Dismiss this step"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
