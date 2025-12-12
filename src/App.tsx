import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { VerifyOTP } from './pages/VerifyOTP';
import { ResetPassword } from './pages/ResetPassword';
import { AdminLogin } from './pages/AdminLogin';

import { Dashboard } from './pages/dashboard/Dashboard';
import { Profile } from './pages/dashboard/Profile';
import { Security } from './pages/dashboard/Security';
import { Mailbox } from './pages/dashboard/Mailbox';
import { Settings } from './pages/dashboard/Settings';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Users } from './pages/admin/Users';
import { Domains } from './pages/admin/Domains';
import { AuditLogs } from './pages/admin/AuditLogs';
import { Storage } from './pages/admin/Storage';
import { Support } from './pages/admin/Support';
import { Aliases } from './pages/admin/Aliases';
import { Activity } from './pages/admin/Activity';
import { Announcements } from './pages/admin/Announcements';
import { AdminManagement } from './pages/admin/AdminManagement';
import { Templates } from './pages/admin/Templates';
import { Groups } from './pages/admin/Groups';
import { ScheduledActions } from './pages/admin/ScheduledActions';
import { SendingLimits } from './pages/admin/SendingLimits';
import { Mailcow } from './pages/admin/Mailcow';
// Main Application Component
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/security"
            element={
              <ProtectedRoute>
                <Security />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/mailbox"
            element={
              <ProtectedRoute>
                <Mailbox />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <Users />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/domains"
            element={
              <AdminRoute>
                <Domains />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <AdminRoute>
                <AuditLogs />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/storage"
            element={
              <AdminRoute>
                <Storage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/support"
            element={
              <AdminRoute>
                <Support />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/aliases"
            element={
              <AdminRoute>
                <Aliases />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/activity"
            element={
              <AdminRoute>
                <Activity />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/announcements"
            element={
              <AdminRoute>
                <Announcements />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/admins"
            element={
              <AdminRoute>
                <AdminManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/templates"
            element={
              <AdminRoute>
                <Templates />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/groups"
            element={
              <AdminRoute>
                <Groups />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/scheduled-actions"
            element={
              <AdminRoute>
                <ScheduledActions />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/sending-limits"
            element={
              <AdminRoute>
                <SendingLimits />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/mailcow"
            element={
              <AdminRoute>
                <Mailcow />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
