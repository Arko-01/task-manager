import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSchedule: (content: string, scheduledAt: string) => void
}

export function ScheduleMessageModal({ isOpen, onClose, onSchedule }: Props) {
  const [content, setContent] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !date || !time) return
    const scheduledAt = new Date(`${date}T${time}`).toISOString()
    onSchedule(content.trim(), scheduledAt)
    setContent('')
    setDate('')
    setTime('')
    onClose()
  }

  return (
    <Modal open={isOpen} onClose={onClose} title="Schedule Message" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="schedule-msg-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Message
          </label>
          <textarea
            id="schedule-msg-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="Type your message..."
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={today}
          />
          <Input
            label="Time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!content.trim() || !date || !time}>
            Schedule
          </Button>
        </div>
      </form>
    </Modal>
  )
}
