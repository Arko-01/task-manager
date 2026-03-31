import { useState, type FormEvent } from 'react'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function LoginForm({ onSwitchToSignup }: { onSwitchToSignup: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const { signIn, loading } = useAuthStore()

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!password) {
      newErrors.password = 'Password is required'
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

    const { error } = await signIn(email, password)
    if (error) {
      setErrors({ form: 'Invalid email or password. Please try again.' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Welcome back</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to your account</p>
      </div>

      {errors.form && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {errors.form}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined, form: undefined })) }}
        placeholder="you@example.com"
        error={errors.email}
        autoFocus
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined, form: undefined })) }}
        placeholder="Your password"
        error={errors.password}
      />

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Signing in...' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitchToSignup} className="text-primary-600 hover:text-primary-700 font-medium">
          Sign up
        </button>
      </p>
    </form>
  )
}
