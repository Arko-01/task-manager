import { useState, useRef, useCallback, type ReactNode } from 'react'
import type { TeamMember } from '../../types'
import { ROLE_CONFIG } from '../../types'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'

interface Props {
  member: TeamMember
  children: ReactNode
}

export function MemberProfile({ member, children }: Props) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), 300)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
  }, [])

  const profile = member.profile
  const roleConfig = ROLE_CONFIG[member.role]
  const bio = profile?.bio
  const skills = profile?.skills || []
  const timezone = profile?.timezone

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {visible && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[280px] rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-800">
          {/* Avatar + Name + Role */}
          <div className="flex items-center gap-3">
            <Avatar name={profile?.full_name} url={profile?.avatar_url} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
                {profile?.full_name || 'Unknown'}
              </p>
              <Badge className="mt-0.5 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                {roleConfig.label}
              </Badge>
            </div>
          </div>

          {/* Email */}
          {profile?.email && (
            <p className="mt-2 truncate text-xs text-gray-500 dark:text-gray-400">
              {profile.email}
            </p>
          )}

          {/* Bio */}
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
            {bio || <span className="text-gray-400 dark:text-gray-500">No bio</span>}
          </p>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Timezone */}
          {timezone && (
            <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500">
              {timezone}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
