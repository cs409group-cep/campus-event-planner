import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'
import CreateEvent from './pages/CreateEvent'
import EditEvent from './pages/EditEvent'
import EventDetails from './pages/EventDetails'
import Calendar from './pages/Calendar'
import PrivateRoute from './components/PrivateRoute'
import { initReminderService } from './utils/reminderService'

function App() {
  useEffect(() => {
    // Initialize reminder service on app load
    initReminderService()
  }, [])

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/event/:id" element={<EventDetails />} />
            <Route
              path="/calendar"
              element={
                <PrivateRoute>
                  <Calendar />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/edit-profile"
              element={
                <PrivateRoute>
                  <EditProfile />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-event"
              element={
                <PrivateRoute>
                  <CreateEvent />
                </PrivateRoute>
              }
            />
            <Route
              path="/edit-event/:id"
              element={
                <PrivateRoute>
                  <EditEvent />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App

