import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')
        
        if (!token || !storedUser) {
          setIsLoading(false)
          return
        }

        // Validate token by making a test API call
        try {
          // Try to get user's workspaces as a validation check
          await api.getWorkspaces()
          
          // If the API call succeeds, the token is valid
          setUser(JSON.parse(storedUser))
          setIsAuthenticated(true)
        } catch (error) {
          console.error('Token validation failed:', error)
          // If token is invalid, clear storage
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (credentials) => {
    try {
      const response = await api.login(credentials)
      setUser(response.user)
      setIsAuthenticated(true)
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      navigate('/dashboard', { replace: true })
      return response
    } catch (error) {
      console.error('Login error:', error)
      
      // Handle the specific NO_WORKSPACES error
      if (error.response?.data?.errorCode === 'NO_WORKSPACES') {
        throw new Error('Your account has no workspaces. Please sign up for a new account or contact support.')
      }
      
      throw error
    }
  }

  const signup = async (userData) => {
    try {
      const response = await api.signup(userData)
      setUser(response.user)
      setIsAuthenticated(true)
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      navigate('/dashboard', { replace: true })
      return response
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login', { replace: true })
  }

  // Handle unauthorized errors globally
  useEffect(() => {
    const handleUnauthorized = (error) => {
      if (error.status === 401 || error.status === 403) {
        logout()
      }
    }

    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.status === 401 || event.reason?.status === 403) {
        handleUnauthorized(event.reason)
      }
    })

    return () => {
      window.removeEventListener('unhandledrejection', handleUnauthorized)
    }
  }, [])

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    </div>
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 