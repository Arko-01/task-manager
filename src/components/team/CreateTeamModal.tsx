import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useTeamStore } from '../../store/teamStore'
import { useToast } from '../ui/Toast'

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateTeamModal({ open, onClose }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const { createTeam } = useTeamStore()
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const { error } = await createTeam(name.trim(), description.trim() || undefined)
    setLoading(false)
    if (error) {
      showToast(error, 'error')
    } else {
      showToast('Team created!', 'success')
      setName('')
      setDescription('')
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Team">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Team Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Marketing Team"
          required
          autoFocus
        />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this team do?"
            rows={3}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? 'Creating...' : 'Create Team'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
