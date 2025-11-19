import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiCalendar, FiUser, FiPlus, FiLogOut } from 'react-icons/fi'

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <FiCalendar className="h-6 w-6 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">EventEase</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/calendar"
                  className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition"
                >
                  <FiCalendar className="h-4 w-4" />
                  <span>Calendar</span>
                </Link>
                <Link
                  to="/create-event"
                  className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition"
                >
                  <FiPlus className="h-4 w-4" />
                  <span>Create Event</span>
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition"
                >
                  <FiUser className="h-4 w-4" />
                  <span>{user?.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition"
                >
                  <FiLogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

