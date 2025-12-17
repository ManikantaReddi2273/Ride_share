import { Navigate, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'

import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/routing/ProtectedRoute'
import PublicRoute from './components/routing/PublicRoute'
import NotImplementedPage from './components/common/NotImplementedPage'
import LandingPage from './features/landing/LandingPage'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import DashboardPage from './features/dashboard/DashboardPage'
import RidePostPage from './features/rides/RidePostPage'
import RideSearchPage from './features/rides/RideSearchPage'
import MyRidesPage from './features/rides/MyRidesPage'
import BookingsPage from './features/rides/BookingsPage'
import PaymentsPage from './features/payments/PaymentsPage'
import ProfilePage from './features/profile/ProfilePage'
import ReviewsPage from './features/reviews/ReviewsPage'
import SettingsPage from './features/settings/SettingsPage'
import AdminDashboardPage from './features/admin/AdminDashboardPage'
import AdminRoute from './components/routing/AdminRoute'

const RootRedirect = () => {
  const { user, token } = useSelector((state) => state.auth)
  // If user is logged in, redirect to dashboard/admin
  if (token && user) {
    return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />
  }
  // Otherwise show landing page
  return <Navigate to="/landing" replace />
}

const App = () => (
  <Routes>
    <Route path="/" element={<RootRedirect />} />
    <Route path="/landing" element={<LandingPage />} />

    <Route
      path="/login"
      element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      }
    />

    <Route
      path="/register"
      element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      }
    />

    <Route
      element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/rides/post" element={<RidePostPage />} />
      <Route path="/rides/search" element={<RideSearchPage />} />
      <Route path="/rides/my-rides" element={<MyRidesPage />} />
      <Route path="/bookings" element={<BookingsPage />} />
      <Route path="/payments" element={<PaymentsPage />} />
      <Route path="/reviews" element={<ReviewsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      
      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        }
      />
    </Route>

    <Route path="*" element={<RootRedirect />} />
  </Routes>
)

export default App
