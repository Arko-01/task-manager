import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'
import { SignupForm } from '../components/auth/SignupForm'
import { useAuthStore } from '../store/authStore'

export function LoginPage() {
  const [isSignup, setIsSignup] = useState(false)
  const { user } = useAuthStore()

  if (user) return <Navigate to="/" replace />

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {isSignup ? (
          <SignupForm onSwitchToLogin={() => setIsSignup(false)} />
        ) : (
          <LoginForm onSwitchToSignup={() => setIsSignup(true)} />
        )}
      </div>
    </div>
  )
}
