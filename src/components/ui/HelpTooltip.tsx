import { useState } from 'react'
import { HelpCircle } from 'lucide-react'

interface Props {
  text: string
  className?: string
}

export function HelpTooltip({ text, className = '' }: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={() => setVisible((v) => !v)}
    >
      <HelpCircle
        size={14}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help"
      />
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 max-w-[200px] rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-gray-700 whitespace-normal text-center">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        </span>
      )}
    </span>
  )
}
