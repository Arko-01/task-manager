export const ERROR_CODES = {
  ERR_AUTH: { code: 'TM-1001', message: 'Authentication failed' },
  ERR_PERMISSION: { code: 'TM-1002', message: "You don't have permission for this action" },
  ERR_NOT_FOUND: { code: 'TM-2001', message: 'The requested item was not found' },
  ERR_CONFLICT: { code: 'TM-2002', message: 'This item was modified by someone else. Refresh and try again.' },
  ERR_NETWORK: { code: 'TM-3001', message: 'Network error. Check your connection and try again.' },
  ERR_VALIDATION: { code: 'TM-4001', message: 'Please check your input and try again.' },
  ERR_DUPLICATE: { code: 'TM-4002', message: 'A similar item already exists.' },
  ERR_SERVER: { code: 'TM-5001', message: 'Something went wrong on our end. Try again later.' },
} as const

export function formatError(error: string | null, fallbackCode?: keyof typeof ERROR_CODES): string {
  if (!error) return ''
  // Map common Supabase error patterns to our error codes
  if (error.includes('JWT') || error.includes('token')) return `${ERROR_CODES.ERR_AUTH.message} (${ERROR_CODES.ERR_AUTH.code})`
  if (error.includes('permission') || error.includes('policy')) return `${ERROR_CODES.ERR_PERMISSION.message} (${ERROR_CODES.ERR_PERMISSION.code})`
  if (error.includes('duplicate') || error.includes('unique')) return `${ERROR_CODES.ERR_DUPLICATE.message} (${ERROR_CODES.ERR_DUPLICATE.code})`
  if (error.includes('network') || error.includes('fetch')) return `${ERROR_CODES.ERR_NETWORK.message} (${ERROR_CODES.ERR_NETWORK.code})`
  if (fallbackCode) return `${ERROR_CODES[fallbackCode].message} (${ERROR_CODES[fallbackCode].code})`
  return `${error} (${ERROR_CODES.ERR_SERVER.code})`
}
