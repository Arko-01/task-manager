import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bold, Italic, Code, List, Link } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  readOnly?: boolean
  rows?: number
}

type ToolbarAction = {
  icon: typeof Bold
  label: string
  prefix: string
  suffix: string
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { icon: Bold, label: 'Bold', prefix: '**', suffix: '**' },
  { icon: Italic, label: 'Italic', prefix: '*', suffix: '*' },
  { icon: Code, label: 'Code', prefix: '`', suffix: '`' },
  { icon: List, label: 'List', prefix: '- ', suffix: '' },
  { icon: Link, label: 'Link', prefix: '[', suffix: '](url)' },
]

export function MarkdownEditor({ value, onChange, placeholder = 'Write something...', readOnly = false, rows = 6 }: Props) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertSyntax = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.slice(start, end)
    const before = value.slice(0, start)
    const after = value.slice(end)

    const newValue = `${before}${prefix}${selected}${suffix}${after}`
    onChange(newValue)

    requestAnimationFrame(() => {
      textarea.focus()
      const cursorPos = start + prefix.length + selected.length + suffix.length
      textarea.setSelectionRange(cursorPos, cursorPos)
    })
  }

  if (readOnly) {
    return (
      <div className="prose prose-sm max-w-none rounded-lg border border-gray-200 bg-gray-50 p-3 dark:prose-invert dark:border-gray-700 dark:bg-gray-800/50">
        {value ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
        ) : (
          <p className="text-gray-400 dark:text-gray-500">{placeholder}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 border border-b-0 border-gray-200 rounded-t-lg bg-gray-50 px-2 py-1 dark:border-gray-700 dark:bg-gray-800">
        <button
          onClick={() => setMode('edit')}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
            mode === 'edit'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Edit
        </button>
        <button
          onClick={() => setMode('preview')}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
            mode === 'preview'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Preview
        </button>

        {/* Toolbar (edit mode only) */}
        {mode === 'edit' && (
          <div className="ml-auto flex items-center gap-0.5">
            {TOOLBAR_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => insertSyntax(action.prefix, action.suffix)}
                className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                aria-label={action.label}
                title={action.label}
              >
                <action.icon size={14} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content area */}
      {mode === 'edit' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full rounded-b-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
      ) : (
        <div className="prose prose-sm max-w-none rounded-b-lg border border-gray-200 bg-white p-3 dark:prose-invert dark:border-gray-700 dark:bg-gray-800" style={{ minHeight: `${rows * 1.5}rem` }}>
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-gray-400 dark:text-gray-500">Nothing to preview</p>
          )}
        </div>
      )}
    </div>
  )
}
