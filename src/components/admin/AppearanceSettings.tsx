import { useState } from 'react'
import { useTeamStore } from '../../store/teamStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useToast } from '../ui/Toast'
import type { Team } from '../../types'

const PRESET_COLORS = [
  '#6366f1', // indigo
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
]

interface AppearanceSettingsProps {
  team: Team
}

export function AppearanceSettings({ team }: AppearanceSettingsProps) {
  const { updateTeam } = useTeamStore()
  const { showToast } = useToast()
  const [brandColor, setBrandColor] = useState(team.brand_color || '#6366f1')
  const [customHex, setCustomHex] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(team.logo_url || null)
  const [saving, setSaving] = useState(false)

  const handleColorSelect = (color: string) => {
    setBrandColor(color)
    setCustomHex('')
  }

  const handleCustomHex = (value: string) => {
    setCustomHex(value)
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      setBrandColor(value)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true)
    const updates: Partial<Team> = { brand_color: brandColor }
    if (logoPreview && logoPreview !== team.logo_url) {
      updates.logo_url = logoPreview
    }
    const { error } = await updateTeam(team.id, updates)
    if (error) showToast(error, 'error')
    else showToast('Appearance updated', 'success')
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Brand Color</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleColorSelect(color)}
              className={`h-8 w-8 rounded-full border-2 transition-all ${
                brandColor === color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              title={color}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Input
            label="Custom Hex"
            value={customHex}
            onChange={(e) => handleCustomHex(e.target.value)}
            placeholder="#ff5500"
            className="max-w-[160px]"
          />
          <div
            className="mt-5 h-8 w-8 rounded-full border border-gray-200 dark:border-gray-700"
            style={{ backgroundColor: brandColor }}
          />
        </div>
      </div>

      {/* Preview */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Preview</h3>
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: brandColor }}
          >
            Sample Button
          </button>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="text-sm font-medium underline"
            style={{ color: brandColor }}
          >
            Sample Link
          </a>
        </div>
      </div>

      {/* Logo */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Workspace Logo</h3>
        {logoPreview && (
          <img
            src={logoPreview}
            alt="Logo preview"
            className="mb-3 h-16 w-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
          />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          className="block text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 dark:file:bg-gray-700 dark:file:text-gray-300"
        />
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Appearance'}
      </Button>
    </div>
  )
}
