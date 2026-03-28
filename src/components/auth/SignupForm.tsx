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
  const { signUp, loading } = useAuthStore()
  const { toast } = useToast()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast('Passwords do not match', 'error')
      return
    }
    if (password.length < 6) {
      toast('Password must be at least 6 characters', 'error')
      return
    }
    const { error } = await signUp(email, password, fullName)
    if (error) {
      toast(error, 'error')
    } else {
      toast('Account created! Check your email to confirm.', 'success')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Create account</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Get started with your team</p>
      </div>

      <Input
        label="Full name"
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Your full name"
        required
        autoFocus
      />

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 6 characters"
        required
        minLength={6}
      />

      <Input
        label="Confirm password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm your password"
        required
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
