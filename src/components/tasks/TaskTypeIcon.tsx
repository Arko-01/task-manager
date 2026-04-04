import { Zap, FolderKanban, Repeat, Settings, GitBranch } from 'lucide-react'
import type { TaskType } from '../../types'

interface Props {
  type: TaskType
  size?: number
  className?: string
}

const ICON_MAP = {
  ad_hoc: { Icon: Zap, colorClass: 'text-red-500 dark:text-red-400' },
  project: { Icon: FolderKanban, colorClass: 'text-blue-500 dark:text-blue-400' },
  recurring: { Icon: Repeat, colorClass: 'text-purple-500 dark:text-purple-400' },
  system: { Icon: Settings, colorClass: 'text-gray-500 dark:text-gray-400' },
  subtask: { Icon: GitBranch, colorClass: 'text-teal-500 dark:text-teal-400' },
} as const

export function TaskTypeIcon({ type, size = 16, className = '' }: Props) {
  const config = ICON_MAP[type]
  const { Icon, colorClass } = config

  return <Icon size={size} className={`${colorClass} ${className}`} />
}
