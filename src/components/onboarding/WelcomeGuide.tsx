import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTeamStore } from '../../store/teamStore'
import { useProjectStore } from '../../store/projectStore'
import { useAuthStore } from '../../store/authStore'
import { CheckCircle2, Users, FolderPlus, ListTodo } from 'lucide-react'

export function WelcomeGuide() {
  const { currentTeam } = useTeamStore()
  const { projects } = useProjectStore()
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('onboarding-dismissed') === 'true')

  if (dismissed) return null

  const steps = [
    {
      id: 'team',
      label: 'Join or create a team',
      done: !!currentTeam,
      icon: Users,
      action: () => {},
    },
    {
      id: 'project',
      label: 'Create your first project',
      done: projects.length > 0,
      icon: FolderPlus,
      action: () => { if (currentTeam) window.dispatchEvent(new CustomEvent('open-create-project')) },
    },
    {
      id: 'task',
      label: 'Add your first task',
      done: false,
      icon: ListTodo,
      action: () => {
        if (projects.length) navigate(`/projects/${projects[0].id}`)
      },
    },
  ]

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
            Get started in 3 steps
          </p>
        </div>
        <button
          onClick={() => { setDismissed(true); localStorage.setItem('onboarding-dismissed', 'true') }}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          Dismiss
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={step.action}
            disabled={step.done}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-primary-100/50 dark:hover:bg-primary-900/30 disabled:opacity-60"
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
        ))}
      </div>

      <div className="mt-4">
        <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-1.5 rounded-full bg-primary-500 transition-all"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">{completedCount}/{steps.length} completed</p>
      </div>
    </div>
  )
}
