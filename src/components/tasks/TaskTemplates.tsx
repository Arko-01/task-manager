import { useState } from 'react'
import { FileText, Plus, Trash2 } from 'lucide-react'
import { useTaskStore } from '../../store/taskStore'
import { useToast } from '../ui/Toast'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import type { TaskStatus, TaskPriority } from '../../types'

interface Template {
  id: string
  name: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
}

const STORAGE_KEY = 'task-templates'

function getTemplates(): Template[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

function saveTemplates(templates: Template[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

interface Props {
  projectId: string
  onCreated?: () => void
}

export function TaskTemplates({ projectId, onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [templates, setTemplates] = useState<Template[]>(getTemplates)
  const { createTask } = useTaskStore()
  const { showToast } = useToast()

  const handleSaveTemplate = () => {
    if (!name.trim() || !title.trim()) return
    const template: Template = {
      id: crypto.randomUUID(),
      name: name.trim(),
      title: title.trim(),
      description: description.trim(),
      status: 'todo',
      priority: 3,
    }
    const updated = [...templates, template]
    saveTemplates(updated)
    setTemplates(updated)
    setCreating(false)
    setName('')
    setTitle('')
    setDescription('')
    showToast('Template saved', 'success')
  }

  const handleUseTemplate = async (template: Template) => {
    const today = new Date().toISOString().split('T')[0]
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    const { error } = await createTask({
      project_id: projectId,
      title: template.title,
      description: template.description || undefined,
      status: template.status,
      priority: template.priority,
      start_date: today,
      end_date: nextWeek,
    })
    if (error) showToast(error, 'error')
    else {
      showToast('Task created from template', 'success')
      onCreated?.()
    }
    setOpen(false)
  }

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter((t) => t.id !== id)
    saveTemplates(updated)
    setTemplates(updated)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
      >
        <FileText size={14} />
        Templates
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Task Templates" size="sm">
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{t.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t.title}</p>
              </div>
              <button onClick={() => handleUseTemplate(t)} className="rounded px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20">
                Use
              </button>
              <button onClick={() => handleDeleteTemplate(t.id)} className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400">
                <Trash2 size={12} />
              </button>
            </div>
          ))}

          {!templates.length && !creating && (
            <p className="py-4 text-center text-sm text-gray-400">No templates yet</p>
          )}

          {creating ? (
            <div className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <Input label="Template name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sprint Review" />
              <Input label="Task title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sprint Review - Week X" />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveTemplate} disabled={!name.trim() || !title.trim()}>Save</Button>
                <button onClick={() => setCreating(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600 dark:border-gray-600 dark:hover:border-gray-500"
            >
              <Plus size={14} />
              Create template
            </button>
          )}
        </div>
      </Modal>
    </>
  )
}
