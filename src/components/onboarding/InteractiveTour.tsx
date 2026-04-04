import { useState, useEffect, useCallback, useRef } from 'react'

export interface TourStep {
  target: string
  title: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

interface Props {
  steps: TourStep[]
  onComplete: () => void
}

const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    target: 'aside',
    title: 'Sidebar Navigation',
    content: 'Use the sidebar to switch teams, navigate projects, and access your tasks.',
    position: 'right',
  },
  {
    target: '[data-tour="quick-add"]',
    title: 'Quick Add Task',
    content: 'Type here to quickly create a new task. Press Enter to add it instantly.',
    position: 'bottom',
  },
  {
    target: '[data-tour="view-toggle"]',
    title: 'View Toggle',
    content: 'Switch between List, Board, Calendar, and Gantt views to see your tasks differently.',
    position: 'bottom',
  },
  {
    target: '[data-tour="filter-bar"]',
    title: 'Filter Bar',
    content: 'Filter tasks by status, priority, type, assignee, and more. Use search to find tasks quickly.',
    position: 'bottom',
  },
  {
    target: '[data-tour="chat-button"]',
    title: 'Team Chat',
    content: 'Click here to open the chat panel and communicate with your team members.',
    position: 'left',
  },
]

export function InteractiveTour({ steps, onComplete }: Props) {
  const tourSteps = steps.length > 0 ? steps : DEFAULT_TOUR_STEPS
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const step = tourSteps[currentStep]

  const updateTargetRect = useCallback(() => {
    if (!step) return
    const el = document.querySelector(step.target)
    if (el) {
      setTargetRect(el.getBoundingClientRect())
    } else {
      setTargetRect(null)
    }
  }, [step])

  useEffect(() => {
    updateTargetRect()
    window.addEventListener('resize', updateTargetRect)
    window.addEventListener('scroll', updateTargetRect, true)
    return () => {
      window.removeEventListener('resize', updateTargetRect)
      window.removeEventListener('scroll', updateTargetRect, true)
    }
  }, [updateTargetRect])

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = () => {
    localStorage.setItem('tour-completed', 'true')
    onComplete()
  }

  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

    const padding = 12
    const pos = step.position

    switch (pos) {
      case 'bottom':
        return {
          top: targetRect.bottom + padding,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translateX(-50%)',
        }
      case 'top':
        return {
          bottom: window.innerHeight - targetRect.top + padding,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translateX(-50%)',
        }
      case 'left':
        return {
          top: targetRect.top + targetRect.height / 2,
          right: window.innerWidth - targetRect.left + padding,
          transform: 'translateY(-50%)',
        }
      case 'right':
        return {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.right + padding,
          transform: 'translateY(-50%)',
        }
    }
  }

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Dark overlay with cutout */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 4}
                y={targetRect.top - 4}
                width={targetRect.width + 8}
                height={targetRect.height + 8}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.5)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Highlight border */}
      {targetRect && (
        <div
          className="absolute rounded-lg border-2 border-primary-400 pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute z-[101] w-72 rounded-xl bg-white p-4 shadow-xl dark:bg-gray-800"
        style={getTooltipStyle()}
      >
        <p className="text-xs font-medium text-primary-500 mb-1">
          Step {currentStep + 1} of {tourSteps.length}
        </p>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {step.title}
        </h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {step.content}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={handleComplete}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            Skip tour
          </button>
          <button
            onClick={handleNext}
            className="rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-600 transition-colors"
          >
            {currentStep < tourSteps.length - 1 ? 'Next' : 'Finish'}
          </button>
        </div>
      </div>
    </div>
  )
}
