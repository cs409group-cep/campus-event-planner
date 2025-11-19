import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { format, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns'
import { FiCalendar, FiClock, FiMapPin, FiChevronLeft, FiChevronRight, FiUsers } from 'react-icons/fi'

const Calendar = () => {
  const { isAuthenticated, user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('week') // 'week' or 'month'

  useEffect(() => {
    if (isAuthenticated) {
      fetchRsvpEvents()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  const fetchRsvpEvents = async () => {
    try {
      const res = await axios.get('/api/users/profile')
      setEvents(res.data.rsvpEvents || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const getWeekStart = (date) => {
    return startOfWeek(date, { weekStartsOn: 1 }) // Monday as start
  }

  const getWeekEnd = (date) => {
    return endOfWeek(date, { weekStartsOn: 1 })
  }

  const getDaysInView = () => {
    if (viewMode === 'week') {
      const start = getWeekStart(currentDate)
      const end = getWeekEnd(currentDate)
      return eachDayOfInterval({ start, end })
    } else {
      // Month view - show current month
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const start = startOfWeek(firstDay, { weekStartsOn: 1 })
      const end = endOfWeek(lastDay, { weekStartsOn: 1 })
      return eachDayOfInterval({ start, end })
    }
  }

  const getEventsForDay = (day) => {
    return events.filter(event => {
      const eventDate = new Date(event.date)
      return isSameDay(eventDate, day)
    })
  }

  const navigateWeek = (direction) => {
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, direction))
    } else {
      setCurrentDate(addWeeks(currentDate, direction * 4))
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const categoryColors = {
    academic: 'bg-blue-100 text-blue-800 border-blue-300',
    social: 'bg-purple-100 text-purple-800 border-purple-300',
    sports: 'bg-green-100 text-green-800 border-green-300',
    cultural: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    fundraiser: 'bg-red-100 text-red-800 border-red-300',
    concert: 'bg-pink-100 text-pink-800 border-pink-300',
    workshop: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    other: 'bg-gray-100 text-gray-800 border-gray-300'
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">Please log in to view your calendar</p>
          <Link
            to="/login"
            className="inline-block px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
          >
            Log In
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const days = getDaysInView()
  const today = new Date()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
            <FiCalendar className="h-8 w-8 text-primary-600" />
            <span>My Calendar</span>
          </h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 border border-gray-300 rounded-md">
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'week'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                  viewMode === 'month'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Month
              </button>
            </div>
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Today
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 hover:bg-gray-100 rounded-md transition"
          >
            <FiChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            {viewMode === 'week'
              ? `${format(getWeekStart(currentDate), 'MMM dd')} - ${format(getWeekEnd(currentDate), 'MMM dd, yyyy')}`
              : format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 hover:bg-gray-100 rounded-md transition"
          >
            <FiChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 bg-gray-50">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayEvents = getEventsForDay(day)
            const isToday = isSameDay(day, today)
            const isCurrentMonth = day.getMonth() === currentDate.getMonth()

            return (
              <div
                key={index}
                className={`min-h-32 border-r border-b border-gray-200 p-2 ${
                  !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                <div
                  className={`text-sm font-medium mb-2 ${
                    isToday
                      ? 'bg-primary-600 text-white rounded-full w-7 h-7 flex items-center justify-center'
                      : isCurrentMonth
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }`}
                >
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <Link
                      key={event._id}
                      to={`/event/${event._id}`}
                      className={`block text-xs p-1.5 rounded border ${
                        categoryColors[event.category] || categoryColors.other
                      } hover:opacity-80 transition truncate`}
                      title={event.title}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="flex items-center space-x-1 text-xs opacity-75">
                        <FiClock className="h-3 w-3" />
                        <span>{event.time}</span>
                      </div>
                    </Link>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 px-1.5">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {events.length === 0 && (
        <div className="text-center py-12 mt-6 bg-white rounded-lg shadow-md">
          <p className="text-gray-500 text-lg mb-4">You haven't RSVP'd to any events yet</p>
          <Link
            to="/"
            className="inline-block px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
          >
            Browse Events
          </Link>
        </div>
      )}
    </div>
  )
}

export default Calendar

