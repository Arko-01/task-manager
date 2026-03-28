interface ProgressBarProps {
  value: number
  className?: string
}

export function ProgressBar({ value, className = '' }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value))
  return (
    <div className={`h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 ${className}`}>
      <div
        className="h-full rounded-full bg-primary-500 transition-all duration-300"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  )
}
