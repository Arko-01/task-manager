interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 transition-opacity duration-500 ${className}`} />
}

const TITLE_WIDTHS = ['max-w-[200px]', 'max-w-[150px]', 'max-w-[260px]', 'max-w-[180px]'] as const
const BADGE_WIDTHS = ['w-16', 'w-12', 'w-20', 'w-14'] as const

export function TaskListSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white transition-opacity duration-500 dark:border-gray-800 dark:bg-gray-900">
      {[0, 1, 2, 3].map((group) => (
        <div key={group}>
          <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-800 dark:bg-gray-800/50">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-6" />
          </div>
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className={`h-4 flex-1 ${TITLE_WIDTHS[(group + row) % TITLE_WIDTHS.length]}`} />
              <Skeleton className={`h-5 ${BADGE_WIDTHS[(group + row) % BADGE_WIDTHS.length]} rounded-full`} />
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const CARD_TITLE_WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-full'] as const

export function TaskBoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 transition-opacity duration-500">
      {[0, 1, 2, 3].map((col) => (
        <div key={col} className="w-72 shrink-0 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-6" />
          </div>
          {[0, 1].map((card) => (
            <div key={card} className="mb-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className={`h-4 ${CARD_TITLE_WIDTHS[(col + card) % CARD_TITLE_WIDTHS.length]}`} />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
