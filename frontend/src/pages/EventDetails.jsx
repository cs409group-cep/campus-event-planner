import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiArrowLeft,
  FiTrash2,
  FiEdit,
  FiHeart,
  FiBell
} from 'react-icons/fi'
import Modal from '../components/Modal'

const EventDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [hasRsvp, setHasRsvp] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [hasLiked, setHasLiked] = useState(false)
  const [showRsvpModal, setShowRsvpModal] = useState(false)
  const [hasReminder, setHasReminder] = useState(false)

  useEffect(() => {
    fetchEvent()
    checkReminder()
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [id])

  // Check if reminder is set for this event
  const checkReminder = async () => {
    if (!isAuthenticated || !user) return
    try {
      const res = await axios.get(`/api/reminders`)
      const hasReminderForEvent = res.data.some(r => r.event?._id === id || r.event?.toString() === id)
      setHasReminder(hasReminderForEvent)
    } catch (error) {
      console.error('Error checking reminder:', error)
    }
  }

  // Refetch event when user becomes available (in case it wasn't loaded initially)
  useEffect(() => {
    if (isAuthenticated && user && event) {
      const userId = user._id || user.id
      const userIdStr = userId?.toString()
      
      // Update like state if user is now available
      const liked = event.likes?.some((like) => {
        const likeId = like._id || like
        return likeId?.toString() === userIdStr || likeId === userId
      }) || false
      
      if (hasLiked !== liked) {
        setHasLiked(liked)
      }
      
      // Update RSVP state if user is now available
      const rsvped = event.rsvps?.some((rsvp) => {
        const rsvpId = rsvp._id || rsvp
        return rsvpId?.toString() === userIdStr || rsvpId === userId
      }) || false
      
      if (hasRsvp !== rsvped) {
        setHasRsvp(rsvped)
      }
      
      // Check reminder status when user is available
      checkReminder()
    }
  }, [user, isAuthenticated, event])

  const fetchEvent = async () => {
    try {
      const res = await axios.get(`/api/events/${id}`)
      setEvent(res.data)
      if (isAuthenticated && user) {
        const userId = user._id || user.id
        const userIdStr = userId?.toString()
        
        setHasRsvp(
          res.data.rsvps?.some((rsvp) => {
            const rsvpId = rsvp._id || rsvp
            return rsvpId?.toString() === userIdStr || rsvpId === userId
          }) || false
        )
        setHasLiked(
          res.data.likes?.some((like) => {
            const likeId = like._id || like
            return likeId?.toString() === userIdStr || likeId === userId
          }) || false
        )
      }
    } catch (error) {
      console.error('Error fetching event:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRsvp = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    setRsvpLoading(true)
    try {
      const userId = user._id || user.id
      const userIdStr = userId?.toString()
      
      if (hasRsvp) {
        await axios.delete(`/api/events/${id}/rsvp`)
        setHasRsvp(false)
        event.rsvps = event.rsvps.filter((rsvp) => {
          const rsvpId = rsvp._id || rsvp
          return rsvpId?.toString() !== userIdStr && rsvpId !== userId
        })
        // Remove reminder when canceling RSVP
        handleRemoveReminder()
      } else {
        await axios.post(`/api/events/${id}/rsvp`)
        setHasRsvp(true)
        event.rsvps.push({ _id: userId, name: user.name })
        // Show success modal
        setShowRsvpModal(true)
      }
      setEvent({ ...event })
      checkReminder()
    } catch (error) {
      console.error('Error updating RSVP:', error)
    } finally {
      setRsvpLoading(false)
    }
  }

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    setLikeLoading(true)
    try {
      if (hasLiked) {
        await axios.delete(`/api/events/${id}/like`)
      } else {
        await axios.post(`/api/events/${id}/like`)
      }
      // Refetch event to get updated state from server
      await fetchEvent()
    } catch (error) {
      console.error('Error updating like:', error)
    } finally {
      setLikeLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return
    }

    try {
      await axios.delete(`/api/events/${id}`)
      navigate('/')
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Failed to delete event')
    }
  }

  const handleSetReminder = async () => {
    if (!isAuthenticated || !user || !event) return

    try {
      await axios.post(`/api/reminders/${id}`)
      setHasReminder(true)
      
      // Show success message
      alert('Reminder set successfully! You will receive email reminders 1 day and 2 hours before the event.')
    } catch (error) {
      console.error('Error setting reminder:', error)
      alert(error.response?.data?.message || 'Failed to set reminder')
    }
  }

  const handleRemoveReminder = async () => {
    if (!isAuthenticated || !user) return

    try {
      await axios.delete(`/api/reminders/${id}`)
      setHasReminder(false)
      alert('Reminder removed successfully')
    } catch (error) {
      console.error('Error removing reminder:', error)
      alert('Failed to remove reminder')
    }
  }

  const categoryColors = {
    academic: 'bg-blue-100 text-blue-800',
    social: 'bg-purple-100 text-purple-800',
    sports: 'bg-green-100 text-green-800',
    cultural: 'bg-yellow-100 text-yellow-800',
    fundraiser: 'bg-red-100 text-red-800',
    concert: 'bg-pink-100 text-pink-800',
    workshop: 'bg-indigo-100 text-indigo-800',
    other: 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Event not found</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-primary-600 hover:text-primary-700"
          >
            Go back to events
          </button>
        </div>
      </div>
    )
  }

  const isOrganizer = isAuthenticated && user && event && event.organizer && (
    event.organizer._id?.toString() === (user._id || user.id)?.toString() ||
    event.organizer._id === (user._id || user.id)
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/')}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <FiArrowLeft className="h-5 w-5" />
        <span>Back to events</span>
      </button>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {event.imageUrl && (
          <div className="h-64 bg-gray-200 overflow-hidden">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {event.title}
              </h1>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  categoryColors[event.category] || categoryColors.other
                }`}
              >
                {event.category}
              </span>
            </div>
            {isOrganizer && (
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate(`/edit-event/${id}`)}
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-md transition"
                  title="Edit event"
                >
                  <FiEdit className="h-5 w-5" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition"
                  title="Delete event"
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="flex items-center space-x-3 text-gray-700">
              <FiCalendar className="h-5 w-5 text-primary-600" />
              <span>{format(new Date(event.date), 'EEEE, MMMM dd, yyyy')}</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700">
              <FiClock className="h-5 w-5 text-primary-600" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700">
              <FiMapPin className="h-5 w-5 text-primary-600" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700">
              <FiUsers className="h-5 w-5 text-primary-600" />
              <span>{event.rsvps?.length || 0} RSVPs</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700">
              <FiHeart className="h-5 w-5 text-primary-600" />
              <span>{event.likes?.length || 0} Likes</span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Description
            </h2>
            <p className="text-gray-700 whitespace-pre-line">
              {event.description}
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6 mb-6">
            <p className="text-sm text-gray-600">
              Organized by{' '}
              <span className="font-medium text-gray-900">
                {event.organizerName || event.organizer?.name}
              </span>
            </p>
          </div>

          {isAuthenticated && (
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleRsvp}
                  disabled={rsvpLoading || isOrganizer}
                  className={`px-6 py-3 rounded-md font-medium transition ${
                    hasRsvp
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {rsvpLoading
                    ? 'Processing...'
                    : hasRsvp
                    ? 'Cancel RSVP'
                    : 'RSVP to Event'}
                </button>
                <button
                  onClick={handleLike}
                  disabled={likeLoading}
                  className={`px-6 py-3 rounded-md font-medium transition flex items-center space-x-2 ${
                    hasLiked
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <FiHeart className={hasLiked ? 'fill-current' : ''} />
                  <span>{hasLiked ? 'Liked' : 'Like'}</span>
                </button>
                {hasRsvp && !isOrganizer && (
                  <button
                    onClick={hasReminder ? handleRemoveReminder : handleSetReminder}
                    className={`px-6 py-3 rounded-md font-medium transition flex items-center space-x-2 ${
                      hasReminder
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    <FiBell className={hasReminder ? 'fill-current' : ''} />
                    <span>{hasReminder ? 'Reminder Set' : 'Set Reminder'}</span>
                  </button>
                )}
              </div>
              {isOrganizer && (
                <p className="text-sm text-gray-500">
                  You cannot RSVP to your own event
                </p>
              )}
            </div>
          )}

          {!isAuthenticated && (
            <div className="border-t border-gray-200 pt-6">
              <p className="text-gray-600 mb-4">
                Please log in to RSVP to this event
              </p>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
              >
                Log In
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RSVP Success Modal */}
      <Modal
        isOpen={showRsvpModal}
        onClose={() => setShowRsvpModal(false)}
        title="Event Added"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                You've successfully RSVP'd to this event!
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {event?.title}
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-gray-700">
                <FiCalendar className="h-4 w-4 text-primary-600" />
                <span>{event && format(new Date(event.date), 'EEEE, MMMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700">
                <FiClock className="h-4 w-4 text-primary-600" />
                <span>{event?.time}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700">
                <FiMapPin className="h-4 w-4 text-primary-600" />
                <span>{event?.location}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>✓ Event added to your calendar!</strong> You can view all your RSVP'd events in the Calendar section.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSetReminder}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition flex items-center justify-center space-x-2"
            >
              <FiBell />
              <span>{hasReminder ? 'Reminder Already Set' : 'Set Reminder'}</span>
            </button>
            <button
              onClick={() => setShowRsvpModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default EventDetails

