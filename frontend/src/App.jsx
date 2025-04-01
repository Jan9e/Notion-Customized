import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from "./pages/LandingPage"
import LoginPage from "./pages/LoginPage"
import SignupPage from "./pages/SignupPage"
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import NewPage from './pages/NewPage';
import { ThemeProvider } from "./components/theme-provider"
import { AuthProvider } from './contexts/AuthContext';
import { PageProvider } from './contexts/PageContext';
import PrivateRoute from './components/PrivateRoute';
import PageEditor from './pages/PageEditor';
import GoalDemoPage from './pages/GoalDemoPage';
import GoalDashboard from './pages/GoalDashboard';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="notion-theme">
      <Router>
        <AuthProvider>
          <PageProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

              {/* Protected routes */}
              <Route
                path="/dashboard/*"
                element={
                  <PrivateRoute>
                    <DashboardPage />
                  </PrivateRoute>
                }
              >
                <Route path="new" element={<NewPage />} />
                <Route path="page/:pageId" element={<PageEditor />} />
              </Route>

              {/* Goal management routes */}
              <Route
                path="/goals"
                element={
                  <PrivateRoute>
                    <GoalDashboard />
                  </PrivateRoute>
                }
              />
              <Route path="/goal-demo" element={<GoalDemoPage />} />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App