import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from "./pages/LandingPage"
import LoginPage from "./pages/LoginPage"
import SignupPage from "./pages/SignupPage"
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import { ThemeProvider } from "./components/theme-provider"

function App() {
  const isAuthenticated = localStorage.getItem('token');

  return (
    <ThemeProvider defaultTheme="light" storageKey="notion-theme">
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/signup" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <SignupPage />} 
          />
          <Route 
            path="/forgot-password" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <ForgotPasswordPage />} 
          />
          <Route 
            path="/reset-password/:token" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <ResetPasswordPage />} 
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/dashboard/:pageId"
            element={
              isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App