import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useProjectStore } from '../../store/projectStore'
import { useToast } from '../ui/Toast'

interface Props {
  open: boolean
  onClose: () => void
}

const EMOJIS = ['📁', '📋', '🚀', '💡', '🎯', '📊', '🔧', '🎨', '📱', '🌐', '⚡', '📝']

export function CreateProjectModal({ open, onClose }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const defaultEnd = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('📁')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(defaultEnd)
  const [loading, setLoading] = useState(false)
  const { createProject } = useProjectStore()
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const { error } = await createProject({
      name: name.trim(),
      emoji,
      description: description.trim() || undefined,
      start_date: startDate,
      end_date: endDate,
    })
    setLoading(false)
    if (error) {
      showToast(error, 'error')
    } else {
      showToast('Project created!', 'success')
      setName('')
      setDescription('')
      setEmoji('📁')
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Icon</label>
            <div className="relative">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                onClick={(e) => {
                  const btn = e.currentTarget
                  const picker = btn.nextElementSibling
                  picker?.classList.toggle('hidden')
                }}
              >
                {emoji}
              </button>
              <div className="hidden absolute top-12 left-0 z-10 grid grid-cols-6 gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={(ev) => {
                      setEmoji(e)
                      ev.currentTarget.closest('.hidden, div')?.classList.add('hidden')
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1">
            <Input
              label="Project Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign"
              required
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about?"
            rows={2}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
