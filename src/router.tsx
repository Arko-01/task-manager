import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { TeamDashboardPage } from './pages/TeamDashboardPage'
import { ProjectPage } from './pages/ProjectPage'
import { AdminPage } from './pages/AdminPage'
import { ProfilePage } from './pages/ProfilePage'
import { TrashPage } from './pages/TrashPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/',
        element: <DashboardPage />,
      },
      {
        path: '/team',
        element: <TeamDashboardPage />,
      },
      {
        path: '/projects/:projectId',
        element: <ProjectPage />,
      },
      {
        path: '/admin',
        element: <AdminPage />,
      },
      {
        path: '/profile',
        element: <ProfilePage />,
      },
      {
        path: '/trash',
        element: <TrashPage />,
      },
    ],
  },
])
