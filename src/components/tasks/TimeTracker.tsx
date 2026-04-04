import { useState } from 'react'
import { Clock } from 'lucide-react'
import { useTaskStore } from '../../store/taskStore'
import { Button } from '../ui/Button'

interface Props {
  taskId: string
  timeSpent: number
  canEdit: boolean
}

export function TimeTracker({ taskId, timeSpent, canEdit }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [inputValue, setInputValue] = useState(0.5)
  const updateTask = useTaskStore((s) => s.updateTask)

  const handleAdd = async () => {
    const newTotal = timeSpent + inputValue
    await updateTask(taskId, { time_spent_days: newTotal })
    setShowForm(false)
    setInputValue(0.5)
  }

  return (
    <div className="inline-flex items-center gap-2 text-sm">
      <Clock size={14} className="text-gray-400 dark:text-gray-500" />
      <span className="text-gray-600 dark:text-gray-400">
        {timeSpent.toFixed(1)}d logged
      </span>

      {canEdit && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          Log time
        </button>
      )}

      {showForm && (
        <div className="inline-flex items-center gap-1.5">
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={inputValue}
            onChange={(e) => setInputValue(parseFloat(e.target.value) || 0)}
            className="w-16 rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            aria-label="Days to log"
          />
          <Button size="sm" onClick={handleAdd} className="!px-2 !py-1 text-xs">
            Add
          </Button>
          <button
            onClick={() => setShowForm(false)}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
