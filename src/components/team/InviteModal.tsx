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

export function InviteModal({ open, onClose }: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const { inviteMember } = useTeamStore()
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    const { error } = await inviteMember(email.trim())
    setLoading(false)
    if (error) {
      showToast(error, 'error')
    } else {
      showToast('Member invited!', 'success')
      setEmail('')
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Invite Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@example.com"
          required
          autoFocus
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          The user must have an account already. They'll be added as a Member by default.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading || !email.trim()}>
            {loading ? 'Inviting...' : 'Invite'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
