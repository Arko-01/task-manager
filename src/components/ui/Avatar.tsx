import { useState } from 'react'

interface AvatarProps {
  name?: string | null
  url?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  xs: 'h-5 w-5 text-[10px]',
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
}

export function Avatar({ name, url, size = 'md', className = '' }: AvatarProps) {
  const initial = name?.charAt(0)?.toUpperCase() || '?'
  const [loaded, setLoaded] = useState(false)

  if (url) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-full bg-primary-100 font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300 ${sizes[size]} ${className}`}
        title={name || undefined}
      >
        {!loaded && <span className="absolute">{initial}</span>}
        <img
          src={url}
          alt={name || 'Avatar'}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 rounded-full object-cover h-full w-full transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-primary-100 font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300 ${sizes[size]} ${className}`}
      title={name || undefined}
    >
      {initial}
    </div>
  )
}
