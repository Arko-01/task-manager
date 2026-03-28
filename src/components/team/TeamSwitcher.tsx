import { useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { useTeamStore } from '../../store/teamStore'
import { CreateTeamModal } from './CreateTeamModal'

export function TeamSwitcher() {
  const { teams, currentTeam, selectTeam } = useTeamStore()
  const [open, setOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  if (!currentTeam) {
    return (
      <>
        <button
          onClick={() => setShowCreate(true)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
        >
          <Plus size={16} />
          Create a Team
        </button>
        <CreateTeamModal open={showCreate} onClose={() => setShowCreate(false)} />
      </>
    )
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
            {currentTeam.name}
          </span>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => { selectTeam(team.id); setOpen(false) }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                    team.id === currentTeam.id
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {team.name}
                </button>
              ))}
              <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
                <button
                  onClick={() => { setShowCreate(true); setOpen(false) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <Plus size={14} />
                  New Team
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <CreateTeamModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  )
}
