import { useEffect, useState } from 'react'
import { Plus, Trash2, FileDown } from 'lucide-react'
import { useProjectStore } from '../../store/projectStore'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useToast } from '../ui/Toast'

interface Props {
  teamId: string
}

export function ProjectTemplateList({ teamId }: Props) {
  const { templates, fetchTemplates, deleteTemplate, createProjectFromTemplate, saveProjectAsTemplate, currentProject } = useProjectStore()
  const { showToast } = useToast()
  const [showCreate, setShowCreate] = useState<string | null>(null) // templateId
  const [showSave, setShowSave] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [templateName, setTemplateName] = useState('')

  useEffect(() => {
    fetchTemplates(teamId)
  }, [teamId, fetchTemplates])

  const handleCreateFromTemplate = async () => {
    if (!showCreate || !projectName.trim() || !startDate || !endDate) return
    const { error } = await createProjectFromTemplate(showCreate, projectName.trim(), startDate, endDate)
    if (error) showToast(error, 'error')
    else { showToast('Project created from template', 'success'); setShowCreate(null); resetForm() }
  }

  const handleSaveAsTemplate = async () => {
    if (!currentProject || !templateName.trim()) return
    const { error } = await saveProjectAsTemplate(currentProject.id, templateName.trim())
    if (error) showToast(error, 'error')
    else { showToast('Project saved as template', 'success'); setShowSave(false); setTemplateName('') }
  }

  const handleDelete = async (id: string) => {
    const { error } = await deleteTemplate(id)
    if (error) showToast(error, 'error')
    else showToast('Template deleted', 'info')
  }

  const resetForm = () => {
    setProjectName('')
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Project Templates</h3>
        {currentProject && !currentProject.is_default && (
          <Button size="sm" variant="secondary" onClick={() => setShowSave(true)}>
            <FileDown size={14} className="mr-1" />
            Save Current as Template
          </Button>
        )}
      </div>

      {templates.length === 0 && (
        <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
          No templates yet. Save a project as a template to get started.
        </p>
      )}

      <div className="space-y-2">
        {templates.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
          >
            <span className="text-lg leading-none">{t.emoji || '📁'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {t.task_templates?.length || 0} task{(t.task_templates?.length || 0) !== 1 ? 's' : ''}
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowCreate(t.id)}
            >
              <Plus size={14} className="mr-1" />
              Create
            </Button>
            <button
              onClick={() => handleDelete(t.id)}
              className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Create from template modal */}
      <Modal open={!!showCreate} onClose={() => { setShowCreate(null); resetForm() }} title="Create from Template" size="sm">
        <div className="space-y-4">
          <Input
            label="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="My New Project"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setShowCreate(null); resetForm() }}>Cancel</Button>
            <Button onClick={handleCreateFromTemplate} disabled={!projectName.trim() || !startDate || !endDate}>
              Create Project
            </Button>
          </div>
        </div>
      </Modal>

      {/* Save as template modal */}
      <Modal open={showSave} onClose={() => { setShowSave(false); setTemplateName('') }} title="Save as Template" size="sm">
        <div className="space-y-4">
          <Input
            label="Template Name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g. Sprint Template"
            autoFocus
          />
          {currentProject && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This will save the structure of "{currentProject.name}" including all task titles, statuses, and priorities.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setShowSave(false); setTemplateName('') }}>Cancel</Button>
            <Button onClick={handleSaveAsTemplate} disabled={!templateName.trim()}>Save Template</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
