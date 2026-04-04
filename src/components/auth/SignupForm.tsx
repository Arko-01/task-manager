import { useState, useMemo, type FormEvent } from 'react'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useToast } from '../ui/Toast'

function getPasswordStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string; checks: { label: string; met: boolean }[] } {
  const checks = [
    { label: '8+ characters', met: pw.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(pw) },
    { label: 'Lowercase letter', met: /[a-z]/.test(pw) },
    { label: 'Number', met: /[0-9]/.test(pw) },
  ]
  const score = checks.filter((c) => c.met).length
  if (score <= 1) return { level: 0, label: 'Weak', color: 'bg-red-500', checks }
  if (score <= 2) return { level: 1, label: 'Fair', color: 'bg-orange-500', checks }
  if (score <= 3) return { level: 2, label: 'Good', color: 'bg-yellow-500', checks }
  return { level: 3, label: 'Strong', color: 'bg-green-500', checks }
}

export function SignupForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string; confirmPassword?: string; form?: string }>({})
  const { signUp, loading } = useAuthStore()
  const { toast } = useToast()

  const clearError = (field: string) => {
    setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }))
  }

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    return newErrors
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const { error } = await signUp(email, password, fullName)
    if (error) {
      setErrors({ form: error })
    } else {
      toast('Account created! Check your email to confirm.', 'success')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Create account</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Get started with your team</p>
      </div>

      {errors.form && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {errors.form}
        </div>
      )}

      <Input
        label="Full name"
        type="text"
        value={fullName}
        onChange={(e) => { setFullName(e.target.value); clearError('fullName') }}
        placeholder="Your full name"
        error={errors.fullName}
        autoFocus
      />

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); clearError('email') }}
        placeholder="you@example.com"
        error={errors.email}
      />

      <div>
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); clearError('password') }}
          placeholder="At least 8 characters"
          error={errors.password}
        />
        {password && <PasswordStrengthMeter password={password} />}
      </div>

      <Input
        label="Confirm password"
        type="password"
        value={confirmPassword}
        onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword') }}
        placeholder="Confirm your password"
        error={errors.confirmPassword}
      />

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating account...' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="text-primary-600 hover:text-primary-700 font-medium">
          Sign in
        </button>
      </p>
    </form>
  )
}

function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = useMemo(() => getPasswordStrength(password), [password])
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.level ? strength.color : 'bg-gray-200 dark:bg-gray-700'}`} />
          ))}
        </div>
        <span className={`text-xs font-medium ${strength.level >= 3 ? 'text-green-600' : strength.level >= 2 ? 'text-yellow-600' : 'text-red-500'}`}>
          {strength.label}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {strength.checks.map((c) => (
          <span key={c.label} className={`text-[10px] ${c.met ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
            {c.met ? '✓' : '○'} {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}
