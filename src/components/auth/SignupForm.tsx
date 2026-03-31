import { useState, type FormEvent } from 'react'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useToast } from '../ui/Toast'

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
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
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

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => { setPassword(e.target.value); clearError('password') }}
        placeholder="At least 6 characters"
        error={errors.password}
      />

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
