import { useState, type FormEvent } from 'react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useToast } from '../ui/Toast'

export function LoginForm({ onSwitchToSignup }: { onSwitchToSignup: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [resetLoading, setResetLoading] = useState(false)
  const { signIn, loading } = useAuthStore()
  const { showToast } = useToast()

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

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrors({ email: 'Enter your email first, then click Forgot Password' })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Please enter a valid email address' })
      return
    }
    setResetLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    setResetLoading(false)
    if (error) {
      setErrors({ form: error.message })
    } else {
      showToast('Password reset email sent! Check your inbox.', 'success')
    }
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

      <div>
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined, form: undefined })) }}
          placeholder="Your password"
          error={errors.password}
        />
        <div className="mt-1 text-right">
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={resetLoading}
            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            {resetLoading ? 'Sending...' : 'Forgot your password?'}
          </button>
        </div>
      </div>

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
